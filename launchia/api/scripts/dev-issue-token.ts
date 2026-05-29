import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { generateToken, hashToken } from '../src/lib/token'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: tsx scripts/dev-issue-token.ts <email>')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  const entries = (await sql`
    SELECT id, confirmed_at FROM launchia_waitlist_entries
    WHERE email = ${email} AND deleted_at IS NULL
    LIMIT 1
  `) as Array<{ id: string; confirmed_at: string | null }>

  if (entries.length === 0) {
    console.error(`No active entry found for ${email}`)
    process.exit(1)
  }

  const entry = entries[0]
  console.log(`Entry id: ${entry.id}`)
  console.log(`Currently confirmed: ${entry.confirmed_at ? 'yes' : 'no'}`)

  await sql`UPDATE launchia_rank_tokens SET revoked_at = NOW() WHERE entry_id = ${entry.id} AND revoked_at IS NULL`

  const token = generateToken()
  const hash = await hashToken(token)
  const hashHex = Buffer.from(hash).toString('hex')
  await sql`INSERT INTO launchia_rank_tokens (entry_id, token_hash) VALUES (${entry.id}, decode(${hashHex}, 'hex'))`

  console.log(`\nNew rank-check URL:`)
  console.log(`  http://localhost:3000/r/${token}`)
  console.log(`\nAPI direct:`)
  console.log(`  http://localhost:8788/api/v1/public/rank/${token}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
