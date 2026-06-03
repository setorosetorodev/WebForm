import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

/**
 * launchia_invite_requests テーブルを作成する（追加のみ・非破壊）。
 * ガード: 既定はドライラン。実行は CONFIRM_MIGRATE=YES を付ける。
 *   ドライラン: npx tsx scripts/migrate-invite-requests.ts
 *   実行:       $env:CONFIRM_MIGRATE="YES"; npx tsx scripts/migrate-invite-requests.ts
 * neon-http は sql.query 非対応のためタグ付きテンプレートを使う（CLAUDE.md 参照）。
 */
const CREATE_SQL = `CREATE TABLE IF NOT EXISTS launchia_invite_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  project_name text,
  url text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  handled_at timestamptz,
  issued_code text,
  handled_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
)
-- 既存テーブルへの列追加（再実行で安全）:
ALTER TABLE launchia_invite_requests ADD COLUMN IF NOT EXISTS handled_at timestamptz;
ALTER TABLE launchia_invite_requests ADD COLUMN IF NOT EXISTS issued_code text;
ALTER TABLE launchia_invite_requests ADD COLUMN IF NOT EXISTS handled_by_user_id uuid;`

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(process.env.DATABASE_URL)

  const existsBefore = (await sql`SELECT to_regclass('public.launchia_invite_requests') AS t`) as Array<{
    t: string | null
  }>
  console.log('table exists (before):', existsBefore[0]?.t ?? null)

  if (process.env.CONFIRM_MIGRATE !== 'YES') {
    console.log('\n[DRY RUN] CONFIRM_MIGRATE=YES を付けると以下を適用します:\n')
    console.log(CREATE_SQL)
    console.log('\nCREATE INDEX IF NOT EXISTS launchia_invite_requests_created_at_idx ON launchia_invite_requests (created_at)')
    return
  }

  await sql`CREATE TABLE IF NOT EXISTS launchia_invite_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    name text,
    project_name text,
    url text,
    message text,
    status text NOT NULL DEFAULT 'pending',
    handled_at timestamptz,
    issued_code text,
    handled_by_user_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
  )`
  // 既存テーブル向けの列追加（IF NOT EXISTS で再実行安全）
  await sql`ALTER TABLE launchia_invite_requests ADD COLUMN IF NOT EXISTS handled_at timestamptz`
  await sql`ALTER TABLE launchia_invite_requests ADD COLUMN IF NOT EXISTS issued_code text`
  await sql`ALTER TABLE launchia_invite_requests ADD COLUMN IF NOT EXISTS handled_by_user_id uuid`
  await sql`CREATE INDEX IF NOT EXISTS launchia_invite_requests_created_at_idx ON launchia_invite_requests (created_at)`
  await sql`CREATE INDEX IF NOT EXISTS launchia_invite_requests_email_idx ON launchia_invite_requests (email)`

  const existsAfter = (await sql`SELECT to_regclass('public.launchia_invite_requests') AS t`) as Array<{
    t: string | null
  }>
  console.log('table exists (after): ', existsAfter[0]?.t ?? null)
  console.log('migrated: launchia_invite_requests is ready')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
