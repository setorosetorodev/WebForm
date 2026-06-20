import { config as loadEnv } from 'dotenv'
import { createDbClient } from '../src/db/client'
import { generateOtpCode, hashOtpCode } from '../src/lib/token'
import { createOtpToken } from '../src/repositories/auth'
import { findUserByEmail } from '../src/repositories/users'

/**
 * dev 専用: 指定 email に OTP コードを発行し、コードを画面に表示する。
 * dev はメール送信元が onboarding@resend.dev（Resend テストモード）で
 * setorosetorodev@gmail.com 宛にしか送れないため、それ以外の宛先で
 * ログインフローを通すための開発用ヘルパー。**本番では使わない。**
 *
 *   npx tsx scripts/dev-issue-otp.ts <email>
 *
 * 表示されたコードを /login の 2 段階目（6桁入力欄）に入力するとログインできる。
 * （createOtpToken は同 email の旧コードを無効化して最新だけ有効にする）
 */
async function main() {
  loadEnv({ override: true })
  loadEnv({ path: '.dev.vars', override: true })

  const email = process.argv[2]
  if (!email) {
    console.error('使い方: npx tsx scripts/dev-issue-otp.ts <email>')
    process.exit(1)
  }
  const dbUrl = process.env.DATABASE_URL
  const secret = process.env.SESSION_SECRET
  if (!dbUrl || !secret) {
    console.error('DATABASE_URL / SESSION_SECRET が必要です（.env / .dev.vars）')
    process.exit(1)
  }
  const db = createDbClient(dbUrl)

  const user = await findUserByEmail(db, email)
  if (!user) {
    console.error(`ユーザーが見つかりません: ${email}（先に /login で登録してください）`)
    process.exit(1)
  }

  const code = generateOtpCode()
  const codeHash = await hashOtpCode(secret, email, code)
  await createOtpToken(db, { userId: user.id, email, codeHash })

  console.log('\n========================================')
  console.log(`  ${email} のログインコード`)
  console.log(`\n      ${code}\n`)
  console.log('  /login の 6桁入力欄に入力してください（10分有効）')
  console.log('========================================\n')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
