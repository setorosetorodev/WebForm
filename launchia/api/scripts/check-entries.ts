import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = (await sql`
    SELECT w.email, w.source, w.position,
           (w.confirmed_at IS NOT NULL) AS confirmed,
           (w.deleted_at IS NOT NULL) AS deleted,
           w.email_anonymized AS anon,
           w.created_at,
           p.slug
    FROM launchia_waitlist_entries w
    JOIN launchia_projects p ON p.id = w.project_id
    ORDER BY w.created_at DESC
    LIMIT 40
  `) as Array<Record<string, unknown>>

  console.log(`entries: ${rows.length}`)
  for (const r of rows) {
    console.log(
      `[${r.slug}] ${r.email} pos=${r.position} confirmed=${r.confirmed} deleted=${r.deleted} anon=${r.anon} src=${r.source} ${r.created_at}`,
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
