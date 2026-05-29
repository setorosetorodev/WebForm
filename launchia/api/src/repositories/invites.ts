import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { inviteCodes, type InviteCode } from '../db/schema'

export async function findValidInviteCode(
  db: DbClient,
  code: string,
): Promise<InviteCode | null> {
  const now = new Date()
  const [invite] = await db
    .select()
    .from(inviteCodes)
    .where(
      and(
        eq(inviteCodes.code, code),
        sql`${inviteCodes.usedCount} < ${inviteCodes.maxUses}`,
        or(isNull(inviteCodes.expiresAt), gt(inviteCodes.expiresAt, now)),
      ),
    )
    .limit(1)
  return invite ?? null
}

export async function consumeInviteCode(db: DbClient, id: string): Promise<void> {
  await db
    .update(inviteCodes)
    .set({ usedCount: sql`${inviteCodes.usedCount} + 1` })
    .where(eq(inviteCodes.id, id))
}
