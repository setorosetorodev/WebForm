import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: tsx scripts/dev-unconfirm.ts <email>')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  const rows = (await sql`
    UPDATE launchia_waitlist_entries
    SET confirmed_at = NULL, updated_at = NOW()
    WHERE email = ${email} AND deleted_at IS NULL
    RETURNING id
  `) as Array<{ id: string }>

  console.log(`Unconfirmed ${rows.length} entries for ${email}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
