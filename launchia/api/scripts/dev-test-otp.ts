import { config as loadEnv } from 'dotenv'
import { eq } from 'drizzle-orm'
import { createDbClient } from '../src/db/client'
import { magicLinkTokens } from '../src/db/schema'
import { generateOtpCode, hashOtpCode } from '../src/lib/token'
import { createOtpToken, verifyOtpToken } from '../src/repositories/auth'

const TEST_EMAIL = 'otp-e2e-test@example.invalid'

let pass = 0
let fail = 0
function check(label: string, ok: boolean, detail = '') {
  if (ok) {
    pass++
    console.log(`  ✅ ${label}${detail ? ` (${detail})` : ''}`)
  } else {
    fail++
    console.log(`  ❌ ${label}${detail ? ` (${detail})` : ''}`)
  }
}

async function main() {
  // import 評価順に依存しないよう、実行時に env をロード（.env=DATABASE_URL / .dev.vars=SESSION_SECRET）
  // override:true ＝ process.env に既存の空キーがあっても確実にファイル値で上書きする
  loadEnv({ override: true })
  loadEnv({ path: '.dev.vars', override: true })
  const dbUrl = process.env.DATABASE_URL
  const secret = process.env.SESSION_SECRET
  if (!dbUrl || !secret) {
    console.error('DATABASE_URL / SESSION_SECRET が必要です（.env / .dev.vars）')
    process.exit(1)
  }
  const db = createDbClient(dbUrl)

  // 念のため過去のテスト行を掃除
  await db.delete(magicLinkTokens).where(eq(magicLinkTokens.email, TEST_EMAIL))

  console.log('\n=== 1. 発行と検証（成功パス）===')
  const code1 = generateOtpCode()
  check('generateOtpCode は 6 桁数字', /^\d{6}$/.test(code1), code1)
  const hash1 = await hashOtpCode(secret, TEST_EMAIL, code1)
  await createOtpToken(db, { userId: null, email: TEST_EMAIL, codeHash: hash1 })

  // 間違いコード → invalid、attempt_count=1
  const wrongHash = await hashOtpCode(secret, TEST_EMAIL, '000000' === code1 ? '111111' : '000000')
  const r1 = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: wrongHash })
  check('間違いコードは invalid', r1.status === 'invalid', r1.status)
  const [afterWrong] = await db.select().from(magicLinkTokens).where(eq(magicLinkTokens.email, TEST_EMAIL))
  check('attempt_count が加算される', afterWrong?.attemptCount === 1, `count=${afterWrong?.attemptCount}`)

  // 正しいコード → ok
  const r2 = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: hash1 })
  check('正しいコードは ok', r2.status === 'ok', r2.status)

  // 単回使用: 再度同じ → expired（used 済みなので有効行なし）
  const r3 = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: hash1 })
  check('使用済みコードは再利用不可', r3.status === 'expired', r3.status)

  console.log('\n=== 2. 再送で旧コード失効 ===')
  const codeOld = generateOtpCode()
  await createOtpToken(db, { userId: null, email: TEST_EMAIL, codeHash: await hashOtpCode(secret, TEST_EMAIL, codeOld) })
  const codeNew = generateOtpCode()
  await createOtpToken(db, { userId: null, email: TEST_EMAIL, codeHash: await hashOtpCode(secret, TEST_EMAIL, codeNew) })
  // 旧コードは失効（旧行は used 化済み。入力は最新の有効行と照合され不一致＝invalid。いずれにせよ ok にならない）
  const rOld = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: await hashOtpCode(secret, TEST_EMAIL, codeOld) })
  check('再送前の旧コードはログイン不可', rOld.status !== 'ok', rOld.status)
  // 新コードは有効
  const rNew = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: await hashOtpCode(secret, TEST_EMAIL, codeNew) })
  check('再送後の新コードは有効', rNew.status === 'ok', rNew.status)

  console.log('\n=== 3. 5 回失敗でロック ===')
  const codeLock = generateOtpCode()
  await createOtpToken(db, { userId: null, email: TEST_EMAIL, codeHash: await hashOtpCode(secret, TEST_EMAIL, codeLock) })
  const bad = await hashOtpCode(secret, TEST_EMAIL, codeLock === '123456' ? '654321' : '123456')
  const statuses: string[] = []
  for (let i = 0; i < 6; i++) {
    const r = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: bad })
    statuses.push(r.status)
  }
  // 1-4 回目 invalid、5 回目で locked、以降 locked
  check('4 回目までは invalid', statuses.slice(0, 4).every((s) => s === 'invalid'), statuses.slice(0, 4).join(','))
  check('5 回目で locked', statuses[4] === 'locked', statuses[4])
  // ロック後は正しいコードでも通らない
  const rAfterLock = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: await hashOtpCode(secret, TEST_EMAIL, codeLock) })
  check('ロック後は正しいコードも拒否', rAfterLock.status === 'locked', rAfterLock.status)

  console.log('\n=== 4. email バインド（別 email のコードは使えない）===')
  const codeBind = generateOtpCode()
  await db.delete(magicLinkTokens).where(eq(magicLinkTokens.email, TEST_EMAIL))
  await createOtpToken(db, { userId: null, email: TEST_EMAIL, codeHash: await hashOtpCode(secret, TEST_EMAIL, codeBind) })
  // 同じ code を別 email の secret bind で叩く → 不一致
  const crossHash = await hashOtpCode(secret, 'someone-else@example.invalid', codeBind)
  const rBind = await verifyOtpToken(db, { email: TEST_EMAIL, codeHash: crossHash })
  check('別 email にバインドしたハッシュは不一致', rBind.status === 'invalid', rBind.status)

  // 後始末
  await db.delete(magicLinkTokens).where(eq(magicLinkTokens.email, TEST_EMAIL))
  console.log('\nクリーンアップ完了（テスト行削除）')

  console.log(`\n=== 結果: ${pass} passed, ${fail} failed ===`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
