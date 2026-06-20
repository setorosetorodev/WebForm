import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { magicLinkTokens, type MagicLinkToken } from '../db/schema'

const OTP_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

/**
 * OTP コードを発行する。同一 email の未使用コードを先に無効化し（最新だけ有効）、
 * 新しいコードのハッシュを 10 分 TTL で保存する。
 * テーブルは Magic Link 時代の launchia_magic_link_tokens を流用（意味＝ワンタイムログイン資格情報）。
 */
export async function createOtpToken(
  db: DbClient,
  params: {
    userId: string | null
    email: string
    codeHash: Uint8Array
  },
): Promise<MagicLinkToken> {
  const now = new Date()

  // 同 email の未使用コードを無効化（再送＝旧コード失効）。
  await db
    .update(magicLinkTokens)
    .set({ usedAt: now })
    .where(and(eq(magicLinkTokens.email, params.email), isNull(magicLinkTokens.usedAt)))

  const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
  const [token] = await db
    .insert(magicLinkTokens)
    .values({
      userId: params.userId,
      email: params.email,
      tokenHash: params.codeHash,
      expiresAt,
    })
    .returning()
  return token
}

export type OtpVerifyResult =
  | { status: 'ok'; token: MagicLinkToken }
  | { status: 'invalid' } // コード不一致（再試行可）
  | { status: 'expired' } // 有効なコードが無い / 期限切れ
  | { status: 'locked' } // 失敗回数超過

/**
 * OTP コードを検証する。email の最新・期限内・未使用コードを対象に、
 * バイト列を定数時間比較する。失敗時は attempt_count を加算し、5 回でロック。
 * 成功時は used_at を確定（単回使用）。
 */
export async function verifyOtpToken(
  db: DbClient,
  params: {
    email: string
    codeHash: Uint8Array
  },
): Promise<OtpVerifyResult> {
  const now = new Date()

  const [token] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.email, params.email),
        isNull(magicLinkTokens.usedAt),
        gt(magicLinkTokens.expiresAt, now),
      ),
    )
    .orderBy(desc(magicLinkTokens.createdAt))
    .limit(1)

  if (!token) return { status: 'expired' }
  if (token.attemptCount >= MAX_ATTEMPTS) return { status: 'locked' }

  if (!constantTimeEqualBytes(token.tokenHash, params.codeHash)) {
    const nextCount = token.attemptCount + 1
    await db
      .update(magicLinkTokens)
      .set({ attemptCount: nextCount })
      .where(eq(magicLinkTokens.id, token.id))
    return nextCount >= MAX_ATTEMPTS ? { status: 'locked' } : { status: 'invalid' }
  }

  // 一致 → 単回使用で確定
  await db
    .update(magicLinkTokens)
    .set({ usedAt: now })
    .where(eq(magicLinkTokens.id, token.id))

  return { status: 'ok', token }
}

function constantTimeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i]
  return result === 0
}
