import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

/**
 * launchia_users に is_admin を追加（運営者フラグ）。追加のみ・非破壊。
 * ガード: 既定はドライラン。実行は CONFIRM_MIGRATE=YES。
 *   ドライラン: npx tsx scripts/migrate-user-is-admin.ts
 *   実行:       $env:CONFIRM_MIGRATE="YES"; npx tsx scripts/migrate-user-is-admin.ts
 * 運営者の付与は scripts/set-admin.ts <email> で行う。
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(process.env.DATABASE_URL)

  const before = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'launchia_users' AND column_name = 'is_admin'
  `) as Array<Record<string, unknown>>
  console.log('is_admin exists (before):', before.length > 0)

  if (process.env.CONFIRM_MIGRATE !== 'YES') {
    console.log('\n[DRY RUN] CONFIRM_MIGRATE=YES を付けると以下を適用します:\n')
    console.log('ALTER TABLE launchia_users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false')
    return
  }

  await sql`ALTER TABLE launchia_users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false`

  const after = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'launchia_users' AND column_name = 'is_admin'
  `) as Array<Record<string, unknown>>
  console.log('is_admin exists (after): ', after.length > 0)
  console.log('migrated: launchia_users.is_admin ready（運営者の付与は set-admin.ts で）')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
