import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

/**
 * launchia_invite_codes に deleted_at を追加（論理削除）。追加のみ・非破壊。
 * ガード: 既定はドライラン。実行は CONFIRM_MIGRATE=YES。
 *   ドライラン: npx tsx scripts/migrate-invite-code-soft-delete.ts
 *   実行:       $env:CONFIRM_MIGRATE="YES"; npx tsx scripts/migrate-invite-code-soft-delete.ts
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(process.env.DATABASE_URL)

  const before = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'launchia_invite_codes' AND column_name = 'deleted_at'
  `) as Array<Record<string, unknown>>
  console.log('deleted_at exists (before):', before.length > 0)

  if (process.env.CONFIRM_MIGRATE !== 'YES') {
    console.log('\n[DRY RUN] CONFIRM_MIGRATE=YES を付けると以下を適用します:\n')
    console.log('ALTER TABLE launchia_invite_codes ADD COLUMN IF NOT EXISTS deleted_at timestamptz')
    return
  }

  await sql`ALTER TABLE launchia_invite_codes ADD COLUMN IF NOT EXISTS deleted_at timestamptz`

  const after = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'launchia_invite_codes' AND column_name = 'deleted_at'
  `) as Array<Record<string, unknown>>
  console.log('deleted_at exists (after): ', after.length > 0)
  console.log('migrated: launchia_invite_codes.deleted_at ready')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
