import { eq } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { rankTokens, waitlistEntries, type WaitlistEntry, type RankToken } from '../db/schema'

export async function createRankToken(
  db: DbClient,
  entryId: string,
  tokenHash: Uint8Array,
): Promise<RankToken> {
  const [token] = await db
    .insert(rankTokens)
    .values({ entryId, tokenHash })
    .returning()
  return token
}

export type RankTokenLookup = {
  token: RankToken
  entry: WaitlistEntry
}

export async function findActiveTokenWithEntry(
  db: DbClient,
  tokenHash: Uint8Array,
): Promise<RankTokenLookup | null> {
  const [row] = await db
    .select({
      token: rankTokens,
      entry: waitlistEntries,
    })
    .from(rankTokens)
    .innerJoin(waitlistEntries, eq(rankTokens.entryId, waitlistEntries.id))
    .where(eq(rankTokens.tokenHash, tokenHash))
    .limit(1)

  if (!row) return null
  if (row.token.revokedAt) return null
  if (row.entry.deletedAt) return null
  return row
}

export async function revokeToken(db: DbClient, tokenId: string): Promise<void> {
  await db.update(rankTokens).set({ revokedAt: new Date() }).where(eq(rankTokens.id, tokenId))
}

export async function revokeTokensForEntry(db: DbClient, entryId: string): Promise<void> {
  await db
    .update(rankTokens)
    .set({ revokedAt: new Date() })
    .where(eq(rankTokens.entryId, entryId))
}

export async function reissueRankToken(
  db: DbClient,
  entryId: string,
  tokenHash: Uint8Array,
): Promise<RankToken> {
  await revokeTokensForEntry(db, entryId)
  const [token] = await db
    .insert(rankTokens)
    .values({ entryId, tokenHash })
    .returning()
  return token
}
