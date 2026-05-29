import { and, eq, gt, isNull } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { magicLinkTokens, type MagicLinkToken } from '../db/schema'

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000

export async function createMagicLinkToken(
  db: DbClient,
  params: {
    userId: string | null
    email: string
    tokenHash: Uint8Array
  },
): Promise<MagicLinkToken> {
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS)
  const [token] = await db
    .insert(magicLinkTokens)
    .values({
      userId: params.userId,
      email: params.email,
      tokenHash: params.tokenHash,
      expiresAt,
    })
    .returning()
  return token
}

export async function consumeMagicLinkToken(
  db: DbClient,
  tokenHash: Uint8Array,
): Promise<MagicLinkToken | null> {
  const now = new Date()
  const [token] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        isNull(magicLinkTokens.usedAt),
        gt(magicLinkTokens.expiresAt, now),
      ),
    )
    .limit(1)

  if (!token) return null

  await db
    .update(magicLinkTokens)
    .set({ usedAt: now })
    .where(eq(magicLinkTokens.id, token.id))

  return token
}
