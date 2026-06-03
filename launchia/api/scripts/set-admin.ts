import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

/**
 * 運営者フラグ（launchia_users.is_admin）を設定する。
 *   付与: npx tsx scripts/set-admin.ts dev@example.com
 *   解除: npx tsx scripts/set-admin.ts dev@example.com false
 * 対象ユーザーが存在する（=一度ログイン済み）必要がある。
 */
async function main() {
  const email = process.argv[2]
  const value = process.argv[3] !== 'false' // 既定 true、'false' のときだけ解除
  if (!email) {
    console.error('Usage: tsx scripts/set-admin.ts <email> [false]')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(process.env.DATABASE_URL)

  const rows = (await sql`
    UPDATE launchia_users SET is_admin = ${value}, updated_at = now()
    WHERE email = ${email}
    RETURNING email, is_admin
  `) as Array<{ email: string; is_admin: boolean }>

  if (rows.length === 0) {
    console.error(`No user found for ${email}（先に一度ログインしてユーザーを作成してください）`)
    process.exit(1)
  }
  console.log(`set is_admin=${rows[0].is_admin} for ${rows[0].email}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
