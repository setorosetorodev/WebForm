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
