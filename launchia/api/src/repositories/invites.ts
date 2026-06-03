import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { inviteCodes, type InviteCode } from '../db/schema'

// 紛らわしい文字（I/O/0/1）を除いた英数。
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** `LCHA-XXXX-XXXX` 形式の招待コードを生成する。 */
export function generateInviteCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
  return `LCHA-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}`
}

export async function listInviteCodes(db: DbClient, limit = 200): Promise<InviteCode[]> {
  return db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt)).limit(limit)
}

export async function createInviteCode(
  db: DbClient,
  input: {
    code: string
    maxUses?: number
    expiresAt?: Date | null
    notes?: string | null
    issuedByUserId?: string | null
  },
): Promise<InviteCode> {
  const [row] = await db
    .insert(inviteCodes)
    .values({
      code: input.code,
      maxUses: input.maxUses ?? 1,
      expiresAt: input.expiresAt ?? null,
      notes: input.notes ?? null,
      issuedByUserId: input.issuedByUserId ?? null,
    })
    .returning()
  return row
}

export async function findInviteCodeById(
  db: DbClient,
  id: string,
): Promise<InviteCode | null> {
  const [row] = await db.select().from(inviteCodes).where(eq(inviteCodes.id, id)).limit(1)
  return row ?? null
}

export async function updateInviteCode(
  db: DbClient,
  id: string,
  fields: { maxUses?: number; notes?: string | null; expiresAt?: Date | null },
): Promise<InviteCode | null> {
  const set: { maxUses?: number; notes?: string | null; expiresAt?: Date | null } = {}
  if (fields.maxUses !== undefined) set.maxUses = fields.maxUses
  if (fields.notes !== undefined) set.notes = fields.notes
  if (fields.expiresAt !== undefined) set.expiresAt = fields.expiresAt
  if (Object.keys(set).length === 0) return findInviteCodeById(db, id)
  const [row] = await db.update(inviteCodes).set(set).where(eq(inviteCodes.id, id)).returning()
  return row ?? null
}

/** 論理削除（行は残す。過去キャンペーンの調査用）。 */
export async function softDeleteInviteCode(db: DbClient, id: string): Promise<InviteCode | null> {
  const [row] = await db
    .update(inviteCodes)
    .set({ deletedAt: new Date() })
    .where(eq(inviteCodes.id, id))
    .returning()
  return row ?? null
}

/** 論理削除の取り消し（復元）。 */
export async function restoreInviteCode(db: DbClient, id: string): Promise<InviteCode | null> {
  const [row] = await db
    .update(inviteCodes)
    .set({ deletedAt: null })
    .where(eq(inviteCodes.id, id))
    .returning()
  return row ?? null
}

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
        isNull(inviteCodes.deletedAt),
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
