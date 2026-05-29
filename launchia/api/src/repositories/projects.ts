import { and, desc, eq } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { projects, type NewProject, type Project } from '../db/schema'

export async function findProjectBySlug(db: DbClient, slug: string): Promise<Project | null> {
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1)
  return project ?? null
}

export async function findProjectById(db: DbClient, id: string): Promise<Project | null> {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  return project ?? null
}

export async function findProjectsForOwner(
  db: DbClient,
  ownerId: string,
): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(eq(projects.ownerUserId, ownerId))
    .orderBy(desc(projects.createdAt))
}

export async function findOwnedProjectById(
  db: DbClient,
  ownerId: string,
  id: string,
): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerUserId, ownerId)))
    .limit(1)
  return project ?? null
}

export type CreateProjectInput = {
  slug: string
  name: string
  description?: string | null
  cover_image_url?: string | null
  landing_page_url?: string | null
  embed_enabled?: boolean
  idea_page_public?: boolean
  require_consent?: boolean
  allowed_origins?: string[]
}

export async function createProjectForOwner(
  db: DbClient,
  ownerId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const values: NewProject = {
    ownerUserId: ownerId,
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    coverImageUrl: input.cover_image_url ?? null,
    landingPageUrl: input.landing_page_url ?? null,
    embedEnabled: input.embed_enabled ?? true,
    ideaPagePublic: input.idea_page_public ?? false,
    requireConsent: input.require_consent ?? false,
    allowedOrigins: input.allowed_origins ?? [],
  }
  const [project] = await db.insert(projects).values(values).returning()
  return project
}

export type UpdateProjectInput = Partial<{
  name: string
  description: string | null
  cover_image_url: string | null
  landing_page_url: string | null
  embed_enabled: boolean
  idea_page_public: boolean
  require_consent: boolean
  allowed_origins: string[]
}>

export async function updateProject(
  db: DbClient,
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const updates: Partial<NewProject> = { updatedAt: new Date() }
  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.cover_image_url !== undefined) updates.coverImageUrl = input.cover_image_url
  if (input.landing_page_url !== undefined) updates.landingPageUrl = input.landing_page_url
  if (input.embed_enabled !== undefined) updates.embedEnabled = input.embed_enabled
  if (input.idea_page_public !== undefined) updates.ideaPagePublic = input.idea_page_public
  if (input.require_consent !== undefined) updates.requireConsent = input.require_consent
  if (input.allowed_origins !== undefined) updates.allowedOrigins = input.allowed_origins

  const [project] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning()
  return project
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false
  if (allowedOrigins.length === 0) return true
  if (allowedOrigins.includes(origin)) return true
  if (isLocalhost(origin)) return true
  return false
}

function isLocalhost(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}
