import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../env'
import { SESSION_COOKIE_NAME, verifySessionValue } from '../lib/session'
import { createDbClient } from '../db/client'
import { findUserById } from '../repositories/users'

declare module 'hono' {
  interface ContextVariableMap {
    user: { id: string; email: string }
  }
}

export function requireAuth(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const cookie = getCookie(c, SESSION_COOKIE_NAME)
    const payload = await verifySessionValue(c.env, cookie)
    if (!payload) {
      return c.json({ error: 'unauthenticated' }, 401)
    }

    const db = createDbClient(c.env.DATABASE_URL)
    const user = await findUserById(db, payload.userId)
    if (!user) {
      return c.json({ error: 'unauthenticated' }, 401)
    }

    c.set('user', { id: user.id, email: user.email })
    await next()
  }
}

/** ADMIN_EMAILS（カンマ区切り）をパースして小文字配列で返す。 */
export function parseAdminEmails(env: Env): string[] {
  return (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
}

/** email が運営者（ADMIN_EMAILS）に含まれるか。未設定なら常に false。 */
export function isAdminEmail(env: Env, email: string): boolean {
  return parseAdminEmails(env).includes(email.trim().toLowerCase())
}

/** requireAuth の後に使う。運営者でなければ 403。 */
export function requireAdmin(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const user = c.get('user')
    if (!user || !isAdminEmail(c.env, user.email)) {
      return c.json({ error: 'forbidden' }, 403)
    }
    await next()
  }
}
