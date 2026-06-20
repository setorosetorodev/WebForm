import { sql } from 'drizzle-orm'
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
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
  // 運営者フラグ（招待管理 /projects/invites のアクセス制御。複数可・再デプロイ不要で増減）
  isAdmin: boolean('is_admin').notNull().default(false),
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
    // OTP コード入力の失敗回数。5 回でロック（ブルートフォース対策）。
    attemptCount: integer('attempt_count').notNull().default(0),
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
  // 論理削除（誤発行の取り消し等）。過去キャンペーンの調査用に行は残す。
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// 招待コードの「申請」。公開 /apply から作成され、運営が確認してコードを発行する。
export const inviteRequests = pgTable(
  'launchia_invite_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name'),
    projectName: text('project_name'),
    url: text('url'),
    message: text('message'),
    status: text('status').notNull().default('pending'), // pending | approved | rejected
    handledAt: timestamp('handled_at', { withTimezone: true }),
    issuedCode: text('issued_code'),
    handledByUserId: uuid('handled_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('launchia_invite_requests_created_at_idx').on(table.createdAt),
    emailIdx: index('launchia_invite_requests_email_idx').on(table.email),
  }),
)

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
  // リリース予定日（任意）。カウントダウン表示用。日付のみ（YYYY-MM-DD）。
  launchTargetDate: date('launch_target_date'),
  // 目標登録数（任意）。例: 1000。進捗バー/マイルストーン(25/50/100/200%)表示用。
  goalCount: integer('goal_count'),
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

// 管理操作の監査ログ。開発者＋システム管理者の「変更系」操作だけを記録する
// （EU 公開トラフィック=登録/確認/閲覧 は入れない。詳細は docs/20260605_launchia_ops_recovery_requirements.md）。
export const adminActions = pgTable(
  'launchia_admin_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 誰が（user 削除後も行は残すため set null）
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorRole: text('actor_role').notNull(), // 'developer' | 'system_admin'
    action: text('action').notNull(), // 例 'entry.resend_confirmation'
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    targetType: text('target_type'), // 'entry' | 'invite_code' | 'invite_request' | 'project'
    targetId: text('target_id'),
    // 宛先メールの可逆暗号化（AES-256-GCM）。base64( iv ‖ ciphertext+tag ) を TEXT 保存。平文は保存しない。
    targetEmailEnc: text('target_email_enc'),
    metadata: jsonb('metadata'), // 任意。平文 PII は入れない
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectCreatedAtIdx: index('launchia_admin_actions_project_created_at_idx').on(
      table.projectId,
      table.createdAt,
    ),
    // R3 クールダウン照会（直近 N 分の同 target への再送有無）
    targetActionCreatedAtIdx: index('launchia_admin_actions_target_action_created_at_idx').on(
      table.targetId,
      table.action,
      table.createdAt,
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
export type InviteRequest = typeof inviteRequests.$inferSelect
export type NewInviteRequest = typeof inviteRequests.$inferInsert
export type RankToken = typeof rankTokens.$inferSelect
export type NewRankToken = typeof rankTokens.$inferInsert
export type RankView = typeof rankViews.$inferSelect
export type NewRankView = typeof rankViews.$inferInsert
export type AdminAction = typeof adminActions.$inferSelect
export type NewAdminAction = typeof adminActions.$inferInsert

export const schema = {
  users,
  magicLinkTokens,
  inviteCodes,
  inviteRequests,
  projects,
  waitlistEntries,
  rankTokens,
  rankViews,
  adminActions,
}
