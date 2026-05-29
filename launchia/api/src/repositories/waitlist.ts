import { and, asc, count, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import {
  waitlistEntries,
  type NewWaitlistEntry,
  type WaitlistEntry,
} from '../db/schema'

export async function findActiveEntryByEmail(
  db: DbClient,
  projectId: string,
  email: string,
): Promise<WaitlistEntry | null> {
  const [entry] = await db
    .select()
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.projectId, projectId),
        eq(waitlistEntries.email, email),
        isNull(waitlistEntries.deletedAt),
      ),
    )
    .limit(1)
  return entry ?? null
}

export async function findActiveEntryById(
  db: DbClient,
  id: string,
): Promise<WaitlistEntry | null> {
  const [entry] = await db
    .select()
    .from(waitlistEntries)
    .where(and(eq(waitlistEntries.id, id), isNull(waitlistEntries.deletedAt)))
    .limit(1)
  return entry ?? null
}

export async function getActiveCount(db: DbClient, projectId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.projectId, projectId),
        isNull(waitlistEntries.deletedAt),
        isNotNull(waitlistEntries.confirmedAt),
      ),
    )
  return Number(result?.value ?? 0)
}

export async function getActiveRank(
  db: DbClient,
  projectId: string,
  entryId: string,
): Promise<number | null> {
  const ranked = db
    .select({
      id: waitlistEntries.id,
      rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${waitlistEntries.position})`.as('rank'),
    })
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.projectId, projectId),
        isNull(waitlistEntries.deletedAt),
        isNotNull(waitlistEntries.confirmedAt),
      ),
    )
    .as('ranked')

  const [row] = await db
    .select({ rank: ranked.rank })
    .from(ranked)
    .where(eq(ranked.id, entryId))
    .limit(1)
  return row?.rank != null ? Number(row.rank) : null
}

export async function confirmEntry(db: DbClient, entryId: string): Promise<void> {
  await db
    .update(waitlistEntries)
    .set({ confirmedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(waitlistEntries.id, entryId), isNull(waitlistEntries.confirmedAt)))
}

type CreateEntryInput = Pick<NewWaitlistEntry, 'projectId' | 'email' | 'source' | 'consentAt'>

export async function createEntry(
  db: DbClient,
  input: CreateEntryInput,
): Promise<WaitlistEntry> {
  const [entry] = await db
    .insert(waitlistEntries)
    .values({
      projectId: input.projectId,
      email: input.email,
      source: input.source,
      consentAt: input.consentAt ?? null,
      position: sql<number>`(SELECT COALESCE(MAX(${waitlistEntries.position}), 0) + 1 FROM ${waitlistEntries} WHERE ${waitlistEntries.projectId} = ${input.projectId} AND ${waitlistEntries.deletedAt} IS NULL)`,
    })
    .returning()
  return entry
}

export type EntryListItem = WaitlistEntry & {
  rankInList: number
}

export async function listEntriesForProject(
  db: DbClient,
  projectId: string,
  opts: { limit: number; offset: number },
): Promise<EntryListItem[]> {
  const entries = await db
    .select()
    .from(waitlistEntries)
    .where(and(eq(waitlistEntries.projectId, projectId), isNull(waitlistEntries.deletedAt)))
    .orderBy(asc(waitlistEntries.position))
    .limit(opts.limit)
    .offset(opts.offset)

  return entries.map((e, i) => ({ ...e, rankInList: opts.offset + i + 1 }))
}

export async function getEntryCounts(
  db: DbClient,
  projectId: string,
): Promise<{ total: number; confirmed: number; pending: number }> {
  const [totalRow] = await db
    .select({ value: count() })
    .from(waitlistEntries)
    .where(and(eq(waitlistEntries.projectId, projectId), isNull(waitlistEntries.deletedAt)))

  const [confirmedRow] = await db
    .select({ value: count() })
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.projectId, projectId),
        isNull(waitlistEntries.deletedAt),
        isNotNull(waitlistEntries.confirmedAt),
      ),
    )

  const total = Number(totalRow?.value ?? 0)
  const confirmed = Number(confirmedRow?.value ?? 0)
  return { total, confirmed, pending: total - confirmed }
}

export async function softDeleteEntry(db: DbClient, entryId: string): Promise<void> {
  await db
    .update(waitlistEntries)
    .set({
      deletedAt: new Date(),
      email: sql`'deleted-' || ${waitlistEntries.id}::text || '@anonymized.local'`,
      emailAnonymized: true,
      updatedAt: new Date(),
    })
    .where(eq(waitlistEntries.id, entryId))
}
