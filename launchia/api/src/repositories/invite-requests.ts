import { desc, eq } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { inviteRequests, type InviteRequest, type NewInviteRequest } from '../db/schema'

export async function createInviteRequest(
  db: DbClient,
  input: Pick<NewInviteRequest, 'email' | 'name' | 'projectName' | 'url' | 'message'>,
): Promise<InviteRequest> {
  const [row] = await db
    .insert(inviteRequests)
    .values({
      email: input.email,
      name: input.name ?? null,
      projectName: input.projectName ?? null,
      url: input.url ?? null,
      message: input.message ?? null,
    })
    .returning()
  return row
}

export async function listInviteRequests(db: DbClient, limit = 200): Promise<InviteRequest[]> {
  return db
    .select()
    .from(inviteRequests)
    .orderBy(desc(inviteRequests.createdAt))
    .limit(limit)
}

export async function findInviteRequestById(
  db: DbClient,
  id: string,
): Promise<InviteRequest | null> {
  const [row] = await db.select().from(inviteRequests).where(eq(inviteRequests.id, id)).limit(1)
  return row ?? null
}

export async function markInviteRequestApproved(
  db: DbClient,
  id: string,
  opts: { issuedCode: string; handledByUserId?: string | null },
): Promise<InviteRequest | null> {
  const [row] = await db
    .update(inviteRequests)
    .set({
      status: 'approved',
      issuedCode: opts.issuedCode,
      handledAt: new Date(),
      handledByUserId: opts.handledByUserId ?? null,
    })
    .where(eq(inviteRequests.id, id))
    .returning()
  return row ?? null
}

export async function markInviteRequestRejected(
  db: DbClient,
  id: string,
  opts: { handledByUserId?: string | null },
): Promise<InviteRequest | null> {
  const [row] = await db
    .update(inviteRequests)
    .set({
      status: 'rejected',
      handledAt: new Date(),
      handledByUserId: opts.handledByUserId ?? null,
    })
    .where(eq(inviteRequests.id, id))
    .returning()
  return row ?? null
}
