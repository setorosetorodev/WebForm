import { and, eq, gt } from 'drizzle-orm'
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
  // 期限内 (expires_at > now) であれば、used 済みでも有効とみなす。
  // 厳格なワンタイムにすると、メールクライアントのリンクスキャンや
  // ブラウザのプリフェッチ / 二重リクエストで先に消費され、本人の
  // クリックが invalid_token になる事故が起きるため。
  // セキュリティは「15 分の有効期限」で担保する。
  const [token] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        gt(magicLinkTokens.expiresAt, now),
      ),
    )
    .limit(1)

  if (!token) return null

  // 初回のみ used_at を記録（監査用。2 回目以降は記録済みなので触らない）
  if (!token.usedAt) {
    await db
      .update(magicLinkTokens)
      .set({ usedAt: now })
      .where(eq(magicLinkTokens.id, token.id))
  }

  return token
}
