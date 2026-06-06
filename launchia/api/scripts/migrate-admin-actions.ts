import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

/**
 * launchia_admin_actions（管理操作の監査ログ）を作成。追加のみ・非破壊・冪等。
 * ガード: 既定はドライラン。実行は CONFIRM_MIGRATE=YES。
 *   ドライラン: npx tsx scripts/migrate-admin-actions.ts
 *   実行:       $env:CONFIRM_MIGRATE="YES"; npx tsx scripts/migrate-admin-actions.ts
 * 詳細仕様: docs/20260605_launchia_ops_recovery_requirements.md（R2）
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(process.env.DATABASE_URL)

  const before = (await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'launchia_admin_actions'
  `) as Array<Record<string, unknown>>
  console.log('launchia_admin_actions exists (before):', before.length > 0)

  if (process.env.CONFIRM_MIGRATE !== 'YES') {
    console.log('\n[DRY RUN] CONFIRM_MIGRATE=YES を付けると以下を適用します:\n')
    console.log(`CREATE TABLE IF NOT EXISTS launchia_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES launchia_users(id) ON DELETE SET NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  project_id uuid REFERENCES launchia_projects(id) ON DELETE SET NULL,
  target_type text,
  target_id text,
  target_email_enc text,   -- base64(iv ‖ ciphertext+tag)。neon-http の bytea 読み戻し回避
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- 既存テーブルが bytea で作られていた場合の是正（空テーブル前提・冪等）
ALTER TABLE launchia_admin_actions ALTER COLUMN target_email_enc TYPE text USING target_email_enc::text;
CREATE INDEX IF NOT EXISTS launchia_admin_actions_project_created_at_idx ON launchia_admin_actions (project_id, created_at);
CREATE INDEX IF NOT EXISTS launchia_admin_actions_target_action_created_at_idx ON launchia_admin_actions (target_id, action, created_at);`)
    return
  }

  await sql`
    CREATE TABLE IF NOT EXISTS launchia_admin_actions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id uuid REFERENCES launchia_users(id) ON DELETE SET NULL,
      actor_role text NOT NULL,
      action text NOT NULL,
      project_id uuid REFERENCES launchia_projects(id) ON DELETE SET NULL,
      target_type text,
      target_id text,
      target_email_enc text,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
  // 既存が bytea でも text に是正（空テーブル前提・冪等）。
  await sql`
    ALTER TABLE launchia_admin_actions
      ALTER COLUMN target_email_enc TYPE text USING target_email_enc::text
  `
  await sql`
    CREATE INDEX IF NOT EXISTS launchia_admin_actions_project_created_at_idx
      ON launchia_admin_actions (project_id, created_at)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS launchia_admin_actions_target_action_created_at_idx
      ON launchia_admin_actions (target_id, action, created_at)
  `

  const after = (await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'launchia_admin_actions'
  `) as Array<Record<string, unknown>>
  console.log('launchia_admin_actions exists (after): ', after.length > 0)
  console.log('migrated: launchia_admin_actions ready')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
