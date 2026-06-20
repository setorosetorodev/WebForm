import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import type { Env } from '../env'
import { createDbClient } from '../db/client'
import { createEmailContext, sendOtpEmail } from '../lib/email'
import { SESSION_COOKIE_NAME, createSessionValue, sessionMaxAge } from '../lib/session'
import { generateOtpCode, hashOtpCode } from '../lib/token'
import { createOtpToken, verifyOtpToken } from '../repositories/auth'
import { consumeInviteCode, findValidInviteCode } from '../repositories/invites'
import { createUser, findUserByEmail, findUserById } from '../repositories/users'
import { requireAuth } from '../middleware/auth'

const authRoutes = new Hono<{ Bindings: Env }>()

const otpRequestSchema = z.object({
  email: z.string().email(),
  invite_code: z.string().optional(),
})

// 6 桁 OTP コードを発行してメール送信する（旧 /magic-link の置き換え）。
// 招待コードゲーティングは旧仕様を踏襲: 既存ユーザでなければ有効な招待コード必須。
authRoutes.post('/otp/request', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = otpRequestSchema.safeParse(body)
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

  const code = generateOtpCode()
  const codeHash = await hashOtpCode(c.env.SESSION_SECRET, email, code)
  await createOtpToken(db, { userId: user.id, email, codeHash })

  try {
    const emailCtx = createEmailContext(c.env)
    await sendOtpEmail(emailCtx, { to: email, code })
  } catch (err) {
    console.error('Failed to send OTP email:', err)
  }

  return c.json({ sent: true })
})

const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
})

// OTP コードを検証し、成功したらセッション Cookie を発行する（旧 /verify の置き換え）。
authRoutes.post('/otp/verify', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const parsed = otpVerifySchema.safeParse(body)
  if (!parsed.success) {
    // 6 桁でない等。攻撃者に内部状態を漏らさないため汎用エラー扱い。
    return c.json({ error: 'invalid_code' }, 401)
  }

  const { email, code } = parsed.data
  const db = createDbClient(c.env.DATABASE_URL)
  const codeHash = await hashOtpCode(c.env.SESSION_SECRET, email, code)
  const result = await verifyOtpToken(db, { email, codeHash })

  if (result.status === 'locked') {
    return c.json({ error: 'too_many_attempts' }, 429)
  }
  if (result.status !== 'ok') {
    // invalid / expired をまとめて汎用化（コード総当たりのヒントを与えない）。
    return c.json({ error: 'invalid_code' }, 401)
  }

  const userId = result.token.userId
  if (!userId) {
    return c.json({ error: 'invalid_code' }, 401)
  }

  const sessionValue = await createSessionValue(c.env, userId)
  setCookie(c, SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: sessionMaxAge(),
  })

  const verifiedUser = await findUserById(db, userId)
  return c.json({
    ok: true,
    userId,
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
