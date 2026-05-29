import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const email = process.argv[2] ?? 'setorosetorodev@gmail.com'
  const sql = neon(process.env.DATABASE_URL!)

  const rows = (await sql`
    SELECT id, email, user_id,
           used_at,
           expires_at,
           created_at,
           (expires_at < now()) AS expired,
           (used_at IS NOT NULL) AS used
    FROM launchia_magic_link_tokens
    WHERE email = ${email}
    ORDER BY created_at DESC
    LIMIT 5
  `) as Array<Record<string, unknown>>

  console.log(`magic_link_tokens for ${email} (newest first):`)
  for (const r of rows) {
    console.log(
      `  created=${r.created_at} used=${r.used} expired=${r.expired} user_id=${r.user_id ? 'set' : 'NULL'}`,
    )
  }

  const users = (await sql`
    SELECT id, email, created_at FROM launchia_users WHERE email = ${email}
  `) as Array<Record<string, unknown>>
  console.log(`\nuser exists: ${users.length > 0}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
