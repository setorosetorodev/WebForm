import { Hono, type Context } from 'hono'
import { z } from 'zod'
import type { Env } from '../env'
import { createDbClient } from '../db/client'
import { findProjectById, findProjectBySlug, isOriginAllowed } from '../repositories/projects'
import {
  confirmEntry,
  createEntry,
  findActiveEntryByEmail,
  getActiveCount,
  getActiveRank,
  softDeleteEntry,
} from '../repositories/waitlist'
import {
  createRankToken,
  findActiveTokenWithEntry,
  reissueRankToken,
  revokeTokensForEntry,
} from '../repositories/rank-tokens'
import { recordView } from '../repositories/rank-views'
import { generateToken, hashToken, hashUserAgent } from '../lib/token'
import {
  createEmailContext,
  sendInviteRequestNotificationEmail,
  sendUnsubscribedEmail,
  sendWaitlistConfirmationEmail,
  sendWaitlistConfirmedEmail,
} from '../lib/email'
import { createInviteRequest } from '../repositories/invite-requests'

const publicRoutes = new Hono<{ Bindings: Env }>()

const registerSchema = z.object({
  email: z.string().email(),
  consent: z.boolean().optional(),
  source: z.enum(['embed', 'idea_page', 'api']).optional(),
})

const inviteRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  project_name: z.string().max(200).optional(),
  url: z.union([z.string().url(), z.literal('')]).optional(),
  message: z.string().max(2000).optional(),
  company: z.string().optional(), // ハニーポット（人間は空のまま / bot が埋める）
})

function applyCorsHeaders(c: Context<{ Bindings: Env }>, origin: string) {
  c.header('Access-Control-Allow-Origin', origin)
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type')
  c.header('Access-Control-Max-Age', '86400')
  c.header('Vary', 'Origin')
}

publicRoutes.get('/projects/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findProjectBySlug(db, slug)

  if (!project) {
    return c.json({ error: 'project_not_found' }, 404)
  }
  if (!project.ideaPagePublic) {
    return c.json({ error: 'idea_page_not_public' }, 404)
  }

  c.header('Cache-Control', 'public, max-age=60')
  return c.json({
    slug: project.slug,
    name: project.name,
    description: project.description,
    cover_image_url: project.coverImageUrl,
    landing_page_url: project.landingPageUrl,
    require_consent: project.requireConsent,
  })
})

// CORS preflight for /projects/:slug/entries
publicRoutes.options('/projects/:slug/entries', async (c) => {
  const slug = c.req.param('slug')
  const origin = c.req.header('Origin') ?? ''

  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findProjectBySlug(db, slug)
  if (!project) return c.body(null, 404)

  if (!isOriginAllowed(origin, project.allowedOrigins)) {
    return c.body(null, 403)
  }

  applyCorsHeaders(c, origin)
  return c.body(null, 204)
})

publicRoutes.post('/projects/:slug/entries', async (c) => {
  const slug = c.req.param('slug')
  const origin = c.req.header('Origin') ?? ''

  const db = createDbClient(c.env.DATABASE_URL)
  const project = await findProjectBySlug(db, slug)
  if (!project) {
    return c.json({ error: 'project_not_found' }, 404)
  }

  if (!project.embedEnabled && !project.ideaPagePublic) {
    return c.json({ error: 'project_closed' }, 403)
  }

  if (!isOriginAllowed(origin, project.allowedOrigins)) {
    return c.json({ error: 'origin_not_allowed' }, 403)
  }

  applyCorsHeaders(c, origin)
  c.header('Cache-Control', 'no-store')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', details: parsed.error.format() }, 400)
  }

  const { email, consent, source = 'embed' } = parsed.data

  if (project.requireConsent && !consent) {
    return c.json({ error: 'consent_required' }, 400)
  }

  const existing = await findActiveEntryByEmail(db, project.id, email)
  if (existing) {
    if (existing.confirmedAt) {
      const existingRank = await getActiveRank(db, project.id, existing.id)
      return c.json(
        {
          error: 'already_registered',
          rank: existingRank,
          project_name: project.name,
        },
        409,
      )
    }

    // 未確認エントリ: 新規トークンを発行して確認メールを再送
    const resendToken = generateToken()
    const resendTokenHash = await hashToken(resendToken)
    await reissueRankToken(db, existing.id, resendTokenHash)
    const resendRankCheckUrl = `${c.env.APP_BASE_URL}/r/${resendToken}`

    try {
      const emailCtx = createEmailContext(c.env)
      await sendWaitlistConfirmationEmail(emailCtx, {
        to: email,
        projectName: project.name,
        rankCheckUrl: resendRankCheckUrl,
      })
    } catch (err) {
      console.error('Failed to resend confirmation email:', err)
    }

    return c.json(
      {
        status: 'confirmation_resent',
        project_name: project.name,
        message: '確認メールを再送しました。メールをご確認ください。',
      },
      200,
    )
  }

  const entry = await createEntry(db, {
    projectId: project.id,
    email,
    source,
    consentAt: consent ? new Date() : null,
  })

  const token = generateToken()
  const tokenHash = await hashToken(token)
  await createRankToken(db, entry.id, tokenHash)

  const rankCheckUrl = `${c.env.APP_BASE_URL}/r/${token}`

  try {
    const emailCtx = createEmailContext(c.env)
    await sendWaitlistConfirmationEmail(emailCtx, {
      to: email,
      projectName: project.name,
      rankCheckUrl,
    })
  } catch (err) {
    console.error('Failed to send confirmation email:', err)
  }

  return c.json(
    {
      status: 'pending_confirmation',
      project_name: project.name,
      message:
        '確認メールをお送りしました。メール内のリンクから登録を完了してください。',
    },
    201,
  )
})

publicRoutes.get('/rank/:token', async (c) => {
  const token = c.req.param('token')
  const tokenHash = await hashToken(token)

  const db = createDbClient(c.env.DATABASE_URL)
  const lookup = await findActiveTokenWithEntry(db, tokenHash)
  if (!lookup) {
    return c.json({ error: 'invalid_token' }, 404)
  }

  const project = await findProjectById(db, lookup.entry.projectId)
  if (!project) {
    return c.json({ error: 'project_not_found' }, 404)
  }

  // 初回確認: confirmed_at をセット
  const justConfirmed = !lookup.entry.confirmedAt
  if (justConfirmed) {
    await confirmEntry(db, lookup.entry.id)
  }

  const totalCount = await getActiveCount(db, lookup.entry.projectId)
  const rank = await getActiveRank(db, lookup.entry.projectId, lookup.entry.id)

  // 初回確認のときだけ「登録完了メール」を送る（順位確認リンクを保管してもらう）
  if (justConfirmed) {
    try {
      const emailCtx = createEmailContext(c.env)
      await sendWaitlistConfirmedEmail(emailCtx, {
        to: lookup.entry.email,
        projectName: project.name,
        rank: rank ?? lookup.entry.position,
        rankCheckUrl: `${c.env.APP_BASE_URL}/r/${token}`,
      })
    } catch (err) {
      console.error('Failed to send confirmed email:', err)
    }
  }

  const userAgent = c.req.header('User-Agent')
  const userAgentHash = await hashUserAgent(userAgent)
  await recordView(db, lookup.entry.id, userAgentHash)

  c.header('Cache-Control', 'no-store')
  c.header('Referrer-Policy', 'no-referrer')

  return c.json({
    rank,
    project_name: project.name,
    total_count: totalCount,
    just_confirmed: justConfirmed,
  })
})

publicRoutes.post('/rank/:token/unsubscribe', async (c) => {
  const token = c.req.param('token')
  const tokenHash = await hashToken(token)

  const db = createDbClient(c.env.DATABASE_URL)
  const lookup = await findActiveTokenWithEntry(db, tokenHash)
  if (!lookup) {
    return c.json({ error: 'invalid_token' }, 404)
  }

  const originalEmail = lookup.entry.email
  const project = await findProjectById(db, lookup.entry.projectId)
  const projectName = project?.name ?? ''

  await softDeleteEntry(db, lookup.entry.id)
  await revokeTokensForEntry(db, lookup.entry.id)

  try {
    const emailCtx = createEmailContext(c.env)
    await sendUnsubscribedEmail(emailCtx, {
      to: originalEmail,
      projectName,
    })
  } catch (err) {
    console.error('Failed to send unsubscribed email:', err)
  }

  c.header('Cache-Control', 'no-store')

  return c.json({ unsubscribed: true })
})

// 招待コードの申請（公開）。保存して運営に通知する。
publicRoutes.post('/invite-requests', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = inviteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', details: parsed.error.format() }, 400)
  }

  const { email, name, project_name, url, message, company } = parsed.data
  c.header('Cache-Control', 'no-store')

  // ハニーポットに入力があれば bot とみなし、保存も通知もせず成功を装う
  if (company && company.length > 0) {
    return c.json({ ok: true }, 201)
  }

  const db = createDbClient(c.env.DATABASE_URL)
  const request = await createInviteRequest(db, {
    email,
    name: name ?? null,
    projectName: project_name ?? null,
    url: url ? url : null,
    message: message ?? null,
  })

  try {
    const emailCtx = createEmailContext(c.env)
    const to = (c.env.INVITE_NOTIFY_TO ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (to.length > 0) {
      await sendInviteRequestNotificationEmail(emailCtx, {
        to,
        request,
        adminUrl: `${c.env.APP_BASE_URL}/projects/invites`,
      })
    }
  } catch (err) {
    console.error('Failed to send invite request notification:', err)
  }

  return c.json({ ok: true }, 201)
})

export { publicRoutes }
