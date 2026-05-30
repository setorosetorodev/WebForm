/**
 * launchia_* テーブルのデータを初期状態に戻す（スキーマは保持、データのみ削除）。
 *
 * 使い方:
 *   1) ドライラン（現在の件数を表示するだけ。何も削除しない）:
 *        npx tsx scripts/reset-db.ts
 *   2) 実行（全 launchia_* テーブルを TRUNCATE）:
 *        # PowerShell
 *        $env:CONFIRM_RESET="YES"; npx tsx scripts/reset-db.ts
 *        # bash
 *        CONFIRM_RESET=YES npx tsx scripts/reset-db.ts
 *   3) リセット後に招待コードを1件発行したい場合は SEED_INVITE=1 も付ける:
 *        $env:CONFIRM_RESET="YES"; $env:SEED_INVITE="1"; npx tsx scripts/reset-db.ts
 *
 * 接続先は .dev.vars / .env の DATABASE_URL（= 本番 Neon）。破壊的かつ不可逆なので注意。
 * neon のタグ付きテンプレート（check-entries.ts と同じ書き方）のみを使う。
 * テーブル名は固定の信頼済みリテラルで、外部入力は SEED_INVITE のコード生成のみ。
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { randomBytes } from 'node:crypto'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL が未設定です（.dev.vars / .env を確認）')
  const sql = neon(url)

  console.log('--- 現在の件数 ---')
  const counts = (await sql`
    SELECT 'launchia_users' AS t, count(*)::int AS n FROM launchia_users
    UNION ALL SELECT 'launchia_invite_codes',        count(*)::int FROM launchia_invite_codes
    UNION ALL SELECT 'launchia_magic_link_tokens',   count(*)::int FROM launchia_magic_link_tokens
    UNION ALL SELECT 'launchia_projects',            count(*)::int FROM launchia_projects
    UNION ALL SELECT 'launchia_waitlist_entries',    count(*)::int FROM launchia_waitlist_entries
    UNION ALL SELECT 'launchia_rank_tokens',         count(*)::int FROM launchia_rank_tokens
    UNION ALL SELECT 'launchia_rank_views',          count(*)::int FROM launchia_rank_views
  `) as Array<{ t: string; n: number }>
  for (const r of counts) console.log(`  ${r.t}: ${r.n}`)

  if (process.env.CONFIRM_RESET !== 'YES') {
    console.log('\nドライラン。実際に削除するには CONFIRM_RESET=YES を付けて再実行してください。')
    return
  }

  console.log('\n全 launchia_* テーブルを TRUNCATE します...')
  // CASCADE で FK 依存ごと削除。RESTART IDENTITY で連番もリセット。
  await sql`
    TRUNCATE TABLE
      launchia_rank_views,
      launchia_rank_tokens,
      launchia_waitlist_entries,
      launchia_magic_link_tokens,
      launchia_projects,
      launchia_invite_codes,
      launchia_users
    RESTART IDENTITY CASCADE
  `
  console.log('完了。全テーブルが空になりました。')

  if (process.env.SEED_INVITE) {
    const part = () => randomBytes(2).toString('hex').toUpperCase()
    const code = `LCHA-${part()}-${part()}`
    await sql`
      INSERT INTO launchia_invite_codes (code, max_uses, notes)
      VALUES (${code}, 5, 'post-reset seed')
    `
    console.log(`招待コードを発行しました: ${code} (max_uses=5)`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
