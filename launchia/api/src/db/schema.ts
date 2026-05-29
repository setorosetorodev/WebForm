import { sql } from 'drizzle-orm'
import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const bytea = customType<{ data: Uint8Array; notNull: false; default: false }>({
  dataType() {
    return 'bytea'
  },
})

export const users = pgTable('launchia_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const magicLinkTokens = pgTable(
  'launchia_magic_link_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    tokenHash: bytea('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: index('launchia_magic_link_tokens_token_hash_idx').on(table.tokenHash),
    emailIdx: index('launchia_magic_link_tokens_email_idx').on(table.email),
  }),
)

export const inviteCodes = pgTable('launchia_invite_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  maxUses: integer('max_uses').notNull().default(1),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  issuedByUserId: uuid('issued_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const projects = pgTable('launchia_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  landingPageUrl: text('landing_page_url'),
  embedEnabled: boolean('embed_enabled').notNull().default(true),
  ideaPagePublic: boolean('idea_page_public').notNull().default(false),
  requireConsent: boolean('require_consent').notNull().default(false),
  allowedOrigins: text('allowed_origins')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const waitlistEntries = pgTable(
  'launchia_waitlist_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    source: text('source').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    position: integer('position').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    emailAnonymized: boolean('email_anonymized').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    activeProjectEmailUidx: uniqueIndex('launchia_waitlist_entries_project_email_active_uidx')
      .on(table.projectId, table.email)
      .where(sql`${table.deletedAt} IS NULL`),
    projectPositionIdx: index('launchia_waitlist_entries_project_position_idx').on(
      table.projectId,
      table.position,
    ),
    projectCreatedAtIdx: index('launchia_waitlist_entries_project_created_at_idx').on(
      table.projectId,
      table.createdAt,
    ),
    activeConfirmedPositionIdx: index(
      'launchia_waitlist_entries_active_confirmed_position_idx',
    )
      .on(table.projectId, table.position)
      .where(sql`${table.deletedAt} IS NULL AND ${table.confirmedAt} IS NOT NULL`),
  }),
)

export const rankTokens = pgTable('launchia_rank_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => waitlistEntries.id, { onDelete: 'cascade' }),
  tokenHash: bytea('token_hash').notNull().unique(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const rankViews = pgTable(
  'launchia_rank_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => waitlistEntries.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
    userAgentHash: bytea('user_agent_hash'),
  },
  (table) => ({
    entryViewedAtIdx: index('launchia_rank_views_entry_viewed_at_idx').on(
      table.entryId,
      table.viewedAt,
    ),
  }),
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type WaitlistEntry = typeof waitlistEntries.$inferSelect
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert
export type InviteCode = typeof inviteCodes.$inferSelect
export type NewInviteCode = typeof inviteCodes.$inferInsert
export type RankToken = typeof rankTokens.$inferSelect
export type NewRankToken = typeof rankTokens.$inferInsert
export type RankView = typeof rankViews.$inferSelect
export type NewRankView = typeof rankViews.$inferInsert

export const schema = {
  users,
  magicLinkTokens,
  inviteCodes,
  projects,
  waitlistEntries,
  rankTokens,
  rankViews,
}
