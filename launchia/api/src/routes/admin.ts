import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../env'
import { createDbClient, type DbClient } from '../db/client'
import type { WaitlistEntry } from '../db/schema'
import { requireAdmin, requireAuth } from '../middleware/auth'
import {
  createProjectForOwner,
  findOwnedProjectById,
  findProjectsForOwner,
  updateProject,
} from '../repositories/projects'
import {
  findActiveEntryById,
  getActiveRank,
  getEntryCounts,
  listEntriesForProject,
  softDeleteEntry,
} from '../repositories/waitlist'
import { reissueRankToken } from '../repositories/rank-tokens'
import {
  findAdminActionById,
  hasRecentAction,
  listAdminActionsWithActor,
  recordAdminAction,
  type ActorRole,
  type RecordAdminActionInput,
} from '../repositories/admin-actions'
import { decryptEmail, maskEmail } from '../lib/audit-crypto'
import { generateToken, hashToken } from '../lib/token'
import { getOverviewForOwner, getProjectStatsForOwner } from '../repositories/stats'
import {
  findInviteRequestById,
  listInviteRequests,
  markInviteRequestApproved,
  markInviteRequestRejected,
} from '../repositories/invite-requests'
import {
  createInviteCode,
  findInviteCodeById,
  generateInviteCode,
  listInviteCodes,
  restoreInviteCode,
  softDeleteInviteCode,
  updateInviteCode,
} from '../repositories/invites'
import {
  createEmailContext,
  sendInviteCodeEmail,
  sendInviteRejectedEmail,
  sendWaitlistConfirmationEmail,
  sendWaitlistConfirmedEmail,
} from '../lib/email'

const adminRoutes = new Hono<{ Bindings: Env }>()

adminRoutes.use('*', requireAuth())

// 監査ログのアクター種別。is_admin ならシステム管理者、それ以外は開発者。
function roleOf(user: { isAdmin: boolean }): ActorRole {
  return user.isAdmin ? 'system_admin' : 'developer'
}

// 監査記録はベストエフォート（失敗しても本来の操作は止めない。失敗はログのみ）。
async function audit(db: DbClient, env: Env, input: RecordAdminActionInput): Promise<void> {
  try {
    await recordAdminAction(db, env, input)
  } catch (err) {
    console.error('audit log failed:', input.action, err)
  }
}

// 同一エントリへの再送/再発行のクールダウン（分）。メール爆撃の経路化を防ぐ。
const RESEND_COOLDOWN_MINUTES = 5
const RESEND_ACTIONS = ['entry.resend_confirmation', 'entry.reissue_rank_link']

const emptyStats = { total: 0, confirmed: 0, pending: 0, todayNew: 0, daily: [0, 0, 0, 0, 0, 0, 0] }

adminRoutes.get('/projects', async (c) => {
  const user = c.get('user')
  const db = createDbClient(c.env.DATABASE_URL)
  const [projects, overview, statsMap] = await Promise.all([
    findProjectsForOwner(db, user.id),
    getOverviewForOwner(db, user.id),
    getProjectStatsForOwner(db, user.id),
  ])
  const withStats = projects.map((p) => ({ ...p, stats: statsMap[p.id] ?? emptyStats }))
  return c.json({ projects: withStats, overview })
})

const slugRegex = /^[a-z0-9-]+$/
const nullableUrl = z
  .union([z.string().url(), z.literal('')])
  .nullable()
  .optional()
  .transform((v) => (v === '' || v == null ? null : v))

const nullableDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')])
  .nullable()
  .optional()
  .transform((v) => (v === '' || v == null ? null : v))

const nullableGoal = z
  .union([z.number().int().min(1).max(100_000_000), z.null()])
  .optional()

const createProjectSchema = z.object({
  slug: z.string().min(2).max(40).regex(slugRegex),
  name: z.string().min(1).max(80),
  description: z.string().max(2000).optional().nullable(),
  cover_image_url: nullableUrl,
  landing_page_url: nullableUrl,
  embed_enabled: z.boolean().optional(),
  idea_page_public: z.boolean().optional(),
  require_consent: z.boolean().optional(),
  allowed_origins: z.array(z.string()).optional(),
  launch_target_date: nullableDate,
  goal_count: nullableGoal,
})

adminRoutes.post('/projects', async (c) => {
  const user = c.get('user')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'validation_failed', details: parsed.error.format() },
      400,
    )
  }

  const db = createDbClient(c.env.DATABASE_URL)

  try {
    const project = await createProjectForOwner(db, user.id, parsed.data)
    await audit(db, c.env, {
      actorUserId: user.id,
      actorRole: roleOf(user),
      action: 'project.create',
      projectId: project.id,
      targetType: 'project',
      targetId: project.id,
    })
    return c.json({ project }, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('duplicate key') || msg.includes('unique')) {
      return c.json({ error: 'slug_already_exists' }, 409)
    }
    throw err
  }
})

adminRoutes.get('/projects/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findOwnedProjectById(db, user.id, id)
  if (!project) {
    return c.json({ error: 'project_not_found' }, 404)
  }
  const counts = await getEntryCounts(db, project.id)
  return c.json({ project, counts })
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(2000).nullable().optional(),
  cover_image_url: nullableUrl,
  landing_page_url: nullableUrl,
  embed_enabled: z.boolean().optional(),
  idea_page_public: z.boolean().optional(),
  require_consent: z.boolean().optional(),
  allowed_origins: z.array(z.string()).optional(),
  launch_target_date: nullableDate,
  goal_count: nullableGoal,
})

adminRoutes.patch('/projects/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = updateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'validation_failed', details: parsed.error.format() },
      400,
    )
  }

  const db = createDbClient(c.env.DATABASE_URL)
  const existing = await findOwnedProjectById(db, user.id, id)
  if (!existing) {
    return c.json({ error: 'project_not_found' }, 404)
  }

  const project = await updateProject(db, id, parsed.data)
  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'project.update',
    projectId: id,
    targetType: 'project',
    targetId: id,
    metadata: { fields: Object.keys(parsed.data) },
  })
  return c.json({ project })
})

adminRoutes.get('/projects/:id/entries', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') ?? '50', 10) || 50, 1), 200)
  const offset = Math.max(parseInt(c.req.query('offset') ?? '0', 10) || 0, 0)

  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findOwnedProjectById(db, user.id, id)
  if (!project) {
    return c.json({ error: 'project_not_found' }, 404)
  }

  const entries = await listEntriesForProject(db, id, { limit, offset })
  const counts = await getEntryCounts(db, id)
  return c.json({
    entries,
    counts,
    project: { id: project.id, name: project.name, slug: project.slug },
    pagination: { limit, offset },
  })
})

adminRoutes.delete('/projects/:id/entries/:entryId', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entryId = c.req.param('entryId')

  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findOwnedProjectById(db, user.id, id)
  if (!project) {
    return c.json({ error: 'project_not_found' }, 404)
  }

  // 削除（匿名化）前にメールを取得して監査ログに残す。
  const entry = await findActiveEntryById(db, entryId)
  await softDeleteEntry(db, entryId)
  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'entry.delete',
    projectId: id,
    targetType: 'entry',
    targetId: entryId,
    targetEmail: entry?.email ?? null,
  })
  return c.json({ deleted: true })
})

// ── エントリ再処理（自己宛の再送/再発行のみ）。owner スコープ。詳細: docs/20260605_..._ops_recovery_requirements.md ──

// 共通: rank トークンを再発行し、エントリ状態に応じたメール（リンク入り）を宛先へ送る。送信成否を返す。
// 未確認 → 「登録の確認をお願いします」、確認済み → 「登録完了（保管してください・順位入り）」。
async function reissueAndSendEmail(
  db: DbClient,
  env: Env,
  entry: WaitlistEntry,
  projectName: string,
): Promise<boolean> {
  const token = generateToken()
  const tokenHash = await hashToken(token)
  await reissueRankToken(db, entry.id, tokenHash)
  const rankCheckUrl = `${env.APP_BASE_URL}/r/${token}`
  try {
    const emailCtx = createEmailContext(env)
    if (entry.confirmedAt) {
      // 確認済み: 順位入りの「登録完了（保管してください）」メール。順位は動的 ROW_NUMBER（public.ts の確認フローと同じ）。
      const rank = await getActiveRank(db, entry.projectId, entry.id)
      await sendWaitlistConfirmedEmail(emailCtx, {
        to: entry.email,
        projectName,
        rank: rank ?? entry.position,
        rankCheckUrl,
      })
    } else {
      // 未確認: ダブルオプトインの「確認をお願いします」メール。
      await sendWaitlistConfirmationEmail(emailCtx, {
        to: entry.email,
        projectName,
        rankCheckUrl,
      })
    }
    return true
  } catch (err) {
    console.error('reprocess email send failed:', err)
    return false
  }
}

// 確認メール再送: active かつ「未確認」エントリ向け。
adminRoutes.post('/projects/:id/entries/:entryId/resend-confirmation', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entryId = c.req.param('entryId')

  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findOwnedProjectById(db, user.id, id)
  if (!project) return c.json({ error: 'project_not_found' }, 404)

  const entry = await findActiveEntryById(db, entryId)
  if (!entry || entry.projectId !== id || entry.emailAnonymized) {
    return c.json({ error: 'entry_not_found' }, 404)
  }
  if (entry.confirmedAt) {
    // 確認済みは reissue-rank-link を使う
    return c.json({ error: 'already_confirmed' }, 409)
  }

  if (await hasRecentAction(db, entryId, RESEND_ACTIONS, RESEND_COOLDOWN_MINUTES)) {
    return c.json({ error: 'cooldown', retry_after_minutes: RESEND_COOLDOWN_MINUTES }, 429)
  }

  const sent = await reissueAndSendEmail(db, c.env, entry, project.name)
  if (!sent) return c.json({ error: 'email_send_failed' }, 502)

  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'entry.resend_confirmation',
    projectId: id,
    targetType: 'entry',
    targetId: entryId,
    targetEmail: entry.email,
  })
  return c.json({ status: 'confirmation_resent' })
})

// 順位リンク再発行: active かつ「確認済み」エントリ向け（旧リンクは失効する）。
adminRoutes.post('/projects/:id/entries/:entryId/reissue-rank-link', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entryId = c.req.param('entryId')

  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findOwnedProjectById(db, user.id, id)
  if (!project) return c.json({ error: 'project_not_found' }, 404)

  const entry = await findActiveEntryById(db, entryId)
  if (!entry || entry.projectId !== id || entry.emailAnonymized) {
    return c.json({ error: 'entry_not_found' }, 404)
  }
  if (!entry.confirmedAt) {
    // 未確認は resend-confirmation を使う
    return c.json({ error: 'not_confirmed' }, 409)
  }

  if (await hasRecentAction(db, entryId, RESEND_ACTIONS, RESEND_COOLDOWN_MINUTES)) {
    return c.json({ error: 'cooldown', retry_after_minutes: RESEND_COOLDOWN_MINUTES }, 429)
  }

  const sent = await reissueAndSendEmail(db, c.env, entry, project.name)
  if (!sent) return c.json({ error: 'email_send_failed' }, 502)

  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'entry.reissue_rank_link',
    projectId: id,
    targetType: 'entry',
    targetId: entryId,
    targetEmail: entry.email,
  })
  return c.json({ status: 'rank_link_reissued' })
})

// ── 運営者専用（招待管理）。requireAuth の後に requireAdmin で運営者に限定する。 ──
adminRoutes.get('/invite-requests', requireAdmin(), async (c) => {
  const db = createDbClient(c.env.DATABASE_URL)
  const requests = await listInviteRequests(db)
  return c.json({ requests })
})

adminRoutes.get('/invite-codes', requireAdmin(), async (c) => {
  const db = createDbClient(c.env.DATABASE_URL)
  const codes = await listInviteCodes(db)
  return c.json({ codes })
})

// 有効期限は「YYYY-MM-DD まで」(JST のその日終わり) で受け取る
function expiryFromDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  return new Date(`${dateStr}T23:59:59+09:00`)
}

const issueCodeSchema = z.object({
  max_uses: z.number().int().min(1).max(1000).optional(),
  expires_at: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(''), z.null()])
    .optional(),
  notes: z.string().max(500).optional(),
})

adminRoutes.post('/invite-codes', requireAdmin(), async (c) => {
  const user = c.get('user')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = issueCodeSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', details: parsed.error.format() }, 400)
  }

  const { max_uses, expires_at, notes } = parsed.data
  const db = createDbClient(c.env.DATABASE_URL)
  const expiresAt = expiryFromDate(expires_at)

  // ごく稀なコード衝突に備えて数回リトライ
  let created
  for (let i = 0; i < 5; i++) {
    try {
      created = await createInviteCode(db, {
        code: generateInviteCode(),
        maxUses: max_uses ?? 1,
        expiresAt,
        notes: notes ?? null,
        issuedByUserId: user.id,
      })
      break
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('duplicate') || msg.includes('unique')) continue
      throw err
    }
  }
  if (!created) {
    return c.json({ error: 'code_generation_failed' }, 500)
  }
  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'invite_code.create',
    targetType: 'invite_code',
    targetId: created.id,
    metadata: { code: created.code, maxUses: created.maxUses },
  })
  return c.json({ code: created }, 201)
})

// コードの更新: 使用上限(+1/-1)・メモ（後から編集）
const patchCodeSchema = z
  .object({
    max_uses: z.number().int().min(1).max(100_000).optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((d) => d.max_uses !== undefined || d.notes !== undefined, {
    message: 'no_fields',
  })

adminRoutes.patch('/invite-codes/:id', requireAdmin(), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }
  const parsed = patchCodeSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', details: parsed.error.format() }, 400)
  }
  const db = createDbClient(c.env.DATABASE_URL)
  const updated = await updateInviteCode(db, id, {
    maxUses: parsed.data.max_uses,
    notes: parsed.data.notes,
  })
  if (!updated) return c.json({ error: 'code_not_found' }, 404)
  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'invite_code.update',
    targetType: 'invite_code',
    targetId: id,
    metadata: { fields: Object.keys(parsed.data) },
  })
  return c.json({ code: updated })
})

// コードの削除（誤発行対応）= 論理削除。行は残し deleted_at を立てる。
adminRoutes.delete('/invite-codes/:id', requireAdmin(), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = createDbClient(c.env.DATABASE_URL)
  const updated = await softDeleteInviteCode(db, id)
  if (!updated) return c.json({ error: 'code_not_found' }, 404)
  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'invite_code.soft_delete',
    targetType: 'invite_code',
    targetId: id,
  })
  return c.json({ code: updated })
})

// 論理削除の取り消し（復元）
adminRoutes.post('/invite-codes/:id/restore', requireAdmin(), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = createDbClient(c.env.DATABASE_URL)
  const updated = await restoreInviteCode(db, id)
  if (!updated) return c.json({ error: 'code_not_found' }, 404)
  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'invite_code.restore',
    targetType: 'invite_code',
    targetId: id,
  })
  return c.json({ code: updated })
})

// 申請を承認 → 発行済みコードを割当 or 新規1回コード発行 → 申請者へメール → 処理済み
const approveSchema = z.object({ code_id: z.string().uuid().optional() })

adminRoutes.post('/invite-requests/:id/approve', requireAdmin(), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  let body: unknown = {}
  try {
    body = await c.req.json()
  } catch {
    // ボディ任意（未指定なら新規1回コードを発行）
  }
  const parsed = approveSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', details: parsed.error.format() }, 400)
  }

  const db = createDbClient(c.env.DATABASE_URL)
  const request = await findInviteRequestById(db, id)
  if (!request) return c.json({ error: 'request_not_found' }, 404)

  let codeRow
  if (parsed.data.code_id) {
    // 発行済みコードを割り当て
    codeRow = await findInviteCodeById(db, parsed.data.code_id)
    if (!codeRow) return c.json({ error: 'code_not_found' }, 404)
  } else {
    // 新規 1 回コードを発行
    for (let i = 0; i < 5; i++) {
      try {
        codeRow = await createInviteCode(db, {
          code: generateInviteCode(),
          maxUses: 1,
          expiresAt: null,
          notes: `承認: ${request.email}`,
          issuedByUserId: user.id,
        })
        break
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('duplicate') || msg.includes('unique')) continue
        throw err
      }
    }
    if (!codeRow) return c.json({ error: 'code_generation_failed' }, 500)
  }

  const updated = await markInviteRequestApproved(db, id, {
    issuedCode: codeRow.code,
    handledByUserId: user.id,
  })

  try {
    const emailCtx = createEmailContext(c.env)
    await sendInviteCodeEmail(emailCtx, {
      to: request.email,
      code: codeRow.code,
      loginUrl: `${c.env.APP_BASE_URL}/login`,
      expiresAt: codeRow.expiresAt,
    })
  } catch (err) {
    console.error('Failed to send invite code email:', err)
  }

  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'invite_request.approve',
    targetType: 'invite_request',
    targetId: id,
    targetEmail: request.email,
    metadata: { code: codeRow.code },
  })

  return c.json({ request: updated, code: codeRow })
})

// 申請を却下（任意で却下メール送信）
const rejectSchema = z.object({ notify: z.boolean().optional() })

adminRoutes.post('/invite-requests/:id/reject', requireAdmin(), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  let body: unknown = {}
  try {
    body = await c.req.json()
  } catch {
    // ボディ任意
  }
  const parsed = rejectSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', details: parsed.error.format() }, 400)
  }

  const db = createDbClient(c.env.DATABASE_URL)
  const request = await findInviteRequestById(db, id)
  if (!request) return c.json({ error: 'request_not_found' }, 404)

  const updated = await markInviteRequestRejected(db, id, { handledByUserId: user.id })

  if (parsed.data.notify) {
    try {
      const emailCtx = createEmailContext(c.env)
      await sendInviteRejectedEmail(emailCtx, { to: request.email })
    } catch (err) {
      console.error('Failed to send reject email:', err)
    }
  }

  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'invite_request.reject',
    targetType: 'invite_request',
    targetId: id,
    targetEmail: request.email,
    metadata: { notified: !!parsed.data.notify },
  })

  return c.json({ request: updated })
})

// ── 監査ログ（システム管理者のみ）。既定はマスク表示、宛先の復号は明示操作。 ──
adminRoutes.get('/audit-actions', requireAdmin(), async (c) => {
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') ?? '100', 10) || 100, 1), 200)
  const offset = Math.max(parseInt(c.req.query('offset') ?? '0', 10) || 0, 0)
  const db = createDbClient(c.env.DATABASE_URL)
  const rows = await listAdminActionsWithActor(db, { limit, offset })
  const actions = await Promise.all(
    rows.map(async (r) => {
      let emailMasked: string | null = null
      if (r.targetEmailEnc) {
        const dec = await decryptEmail(c.env, r.targetEmailEnc)
        emailMasked = dec ? maskEmail(dec) : null
      }
      return {
        id: r.id,
        createdAt: r.createdAt,
        action: r.action,
        actorRole: r.actorRole,
        actorEmail: r.actorEmail,
        projectId: r.projectId,
        targetType: r.targetType,
        targetId: r.targetId,
        metadata: r.metadata,
        hasEmail: !!r.targetEmailEnc,
        emailMasked,
      }
    }),
  )
  return c.json({ actions, pagination: { limit, offset } })
})

// 宛先メールの復号表示（明示操作）。reveal 自体も監査に残す。
adminRoutes.post('/audit-actions/:id/reveal', requireAdmin(), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = createDbClient(c.env.DATABASE_URL)
  const row = await findAdminActionById(db, id)
  if (!row) return c.json({ error: 'not_found' }, 404)
  const email = await decryptEmail(c.env, row.targetEmailEnc)
  if (!email) return c.json({ error: 'no_email' }, 404)
  await audit(db, c.env, {
    actorUserId: user.id,
    actorRole: roleOf(user),
    action: 'audit.reveal_email',
    targetType: 'admin_action',
    targetId: id,
  })
  return c.json({ email })
})

export { adminRoutes }
