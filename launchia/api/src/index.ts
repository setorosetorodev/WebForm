import { Hono } from 'hono'
import type { Env } from './env'
import { adminRoutes } from './routes/admin'
import { authRoutes } from './routes/auth'
import { publicRoutes } from './routes/public'

const app = new Hono<{ Bindings: Env }>()

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'launchia-api',
    environment: c.env.ENVIRONMENT,
  })
})

app.route('/api/v1/public', publicRoutes)
app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/admin', adminRoutes)

export default app
