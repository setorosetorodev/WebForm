import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../env'
import { createDbClient } from '../db/client'
import { requireAuth } from '../middleware/auth'
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

const adminRoutes = new Hono<{ Bindings: Env }>()

adminRoutes.use('*', requireAuth())

adminRoutes.get('/projects', async (c) => {
  const user = c.get('user')
  const db = createDbClient(c.env.DATABASE_URL)
  const projects = await findProjectsForOwner(db, user.id)
  return c.json({ projects })
})

const slugRegex = /^[a-z0-9-]+$/
const nullableUrl = z
  .union([z.string().url(), z.literal('')])
  .nullable()
  .optional()
  .transform((v) => (v === '' || v == null ? null : v))

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

export { adminRoutes }
