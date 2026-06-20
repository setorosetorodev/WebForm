import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

/**
 * launchia_magic_link_tokens に attempt_count を追加（OTP コード入力の失敗回数）。
 * Magic Link → OTP コードログインへの置き換えに伴う追加列。追加のみ・非破壊・冪等。
 * ガード: 既定はドライラン。実行は CONFIRM_MIGRATE=YES。
 *   ドライラン: npx tsx scripts/migrate-otp-attempt-count.ts
 *   実行:       $env:CONFIRM_MIGRATE="YES"; npx tsx scripts/migrate-otp-attempt-count.ts
 * ※ .dev.vars の DATABASE_URL は本番 Neon を指すため、実行＝本番に適用。
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(process.env.DATABASE_URL)

  const before = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'launchia_magic_link_tokens' AND column_name = 'attempt_count'
  `) as Array<Record<string, unknown>>
  console.log('attempt_count exists (before):', before.length > 0)

  if (process.env.CONFIRM_MIGRATE !== 'YES') {
    console.log('\n[DRY RUN] CONFIRM_MIGRATE=YES を付けると以下を適用します:\n')
    console.log(
      'ALTER TABLE launchia_magic_link_tokens ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0',
    )
    return
  }

  await sql`ALTER TABLE launchia_magic_link_tokens ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0`

  const after = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'launchia_magic_link_tokens' AND column_name = 'attempt_count'
  `) as Array<Record<string, unknown>>
  console.log('attempt_count exists (after): ', after.length > 0)
  console.log('migrated: launchia_magic_link_tokens.attempt_count ready')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
