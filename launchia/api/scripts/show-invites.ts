import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = (await sql`
    SELECT code, max_uses, used_count, notes, created_at
    FROM launchia_invite_codes
    ORDER BY created_at DESC
  `) as Array<Record<string, unknown>>
  console.log(`invite_codes: ${rows.length}`)
  for (const r of rows) {
    console.log(`  code=${r.code} max=${r.max_uses} used=${r.used_count} notes=${r.notes}`)
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
