import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../env'
import { createDbClient } from '../db/client'
import { requireAdmin, requireAuth } from '../middleware/auth'
import {
  createProjectForOwner,
  findOwnedProjectById,
  findProjectsForOwner,
  updateProject,
} from '../repositories/projects'
import {
  getEntryCounts,
  listEntriesForProject,
  softDeleteEntry,
} from '../repositories/waitlist'
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
} from '../lib/email'

const adminRoutes = new Hono<{ Bindings: Env }>()

adminRoutes.use('*', requireAuth())

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

  await softDeleteEntry(db, entryId)
  return c.json({ deleted: true })
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
  return c.json({ code: updated })
})

// コードの削除（誤発行対応）= 論理削除。行は残し deleted_at を立てる。
adminRoutes.delete('/invite-codes/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id')
  const db = createDbClient(c.env.DATABASE_URL)
  const updated = await softDeleteInviteCode(db, id)
  if (!updated) return c.json({ error: 'code_not_found' }, 404)
  return c.json({ code: updated })
})

// 論理削除の取り消し（復元）
adminRoutes.post('/invite-codes/:id/restore', requireAdmin(), async (c) => {
  const id = c.req.param('id')
  const db = createDbClient(c.env.DATABASE_URL)
  const updated = await restoreInviteCode(db, id)
  if (!updated) return c.json({ error: 'code_not_found' }, 404)
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

  return c.json({ request: updated })
})

export { adminRoutes }
