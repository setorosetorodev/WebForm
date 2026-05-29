import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  console.log('Step 1: Adding confirmed_at column...')
  await sql`
    ALTER TABLE launchia_waitlist_entries
    ADD COLUMN IF NOT EXISTS confirmed_at timestamptz
  `

  console.log('Step 2: Creating active_confirmed_position index...')
  await sql`
    CREATE INDEX IF NOT EXISTS launchia_waitlist_entries_active_confirmed_position_idx
    ON launchia_waitlist_entries (project_id, position)
    WHERE deleted_at IS NULL AND confirmed_at IS NOT NULL
  `

  console.log('Step 3: Backfilling confirmed_at for existing active entries (dev)...')
  const rows = await sql`
    UPDATE launchia_waitlist_entries
    SET confirmed_at = NOW(), updated_at = NOW()
    WHERE confirmed_at IS NULL AND deleted_at IS NULL
    RETURNING id
  `
  console.log(`Backfilled ${rows.length} entries`)

  console.log('\nMigration completed')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
