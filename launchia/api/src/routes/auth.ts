import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import type { Env } from '../env'
import { createDbClient } from '../db/client'
import { createEmailContext, sendMagicLinkEmail } from '../lib/email'
import { SESSION_COOKIE_NAME, createSessionValue, sessionMaxAge } from '../lib/session'
import { generateToken, hashToken } from '../lib/token'
import {
  consumeMagicLinkToken,
  createMagicLinkToken,
} from '../repositories/auth'
import { consumeInviteCode, findValidInviteCode } from '../repositories/invites'
import { createUser, findUserByEmail, findUserById } from '../repositories/users'
import { requireAuth } from '../middleware/auth'

const authRoutes = new Hono<{ Bindings: Env }>()

const magicLinkSchema = z.object({
  email: z.string().email(),
  invite_code: z.string().optional(),
})

authRoutes.post('/magic-link', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = magicLinkSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'validation_failed' }, 400)
  }

  const { email, invite_code: inviteCodeInput } = parsed.data
  const db = createDbClient(c.env.DATABASE_URL)

  let user = await findUserByEmail(db, email)

  if (!user) {
    if (!inviteCodeInput) {
      return c.json({ error: 'invite_code_required' }, 400)
    }
    const invite = await findValidInviteCode(db, inviteCodeInput)
    if (!invite) {
      return c.json({ error: 'invalid_invite_code' }, 400)
    }
    user = await createUser(db, email)
    await consumeInviteCode(db, invite.id)
  }

  const token = generateToken()
  const tokenHash = await hashToken(token)
  await createMagicLinkToken(db, {
    userId: user.id,
    email,
    tokenHash,
  })

  const verifyUrl = `${c.env.APP_BASE_URL}/auth/verify?token=${encodeURIComponent(token)}`

  try {
    const emailCtx = createEmailContext(c.env)
    await sendMagicLinkEmail(emailCtx, { to: email, verifyUrl })
  } catch (err) {
    console.error('Failed to send magic link email:', err)
  }

  return c.json({ sent: true })
})

authRoutes.get('/verify', async (c) => {
  const token = c.req.query('token')
  if (!token) {
    return c.json({ error: 'token_required' }, 400)
  }

  const db = createDbClient(c.env.DATABASE_URL)
  const tokenHash = await hashToken(token)
  const magicToken = await consumeMagicLinkToken(db, tokenHash)
  if (!magicToken || !magicToken.userId) {
    return c.json({ error: 'invalid_or_expired_token' }, 401)
  }

  const sessionValue = await createSessionValue(c.env, magicToken.userId)
  setCookie(c, SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: sessionMaxAge(),
  })

  const verifiedUser = await findUserById(db, magicToken.userId)
  return c.json({
    ok: true,
    userId: magicToken.userId,
    isAdmin: verifiedUser?.isAdmin ?? false,
  })
})

authRoutes.post('/logout', async (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

authRoutes.get('/me', requireAuth(), (c) => {
  const user = c.get('user')
  return c.json({ user, isAdmin: user.isAdmin })
})

export { authRoutes }
