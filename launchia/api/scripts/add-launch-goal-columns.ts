import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { createDbClient } from '../src/db/client'

/**
 * launchia_projects に launch_target_date / goal_count を追加（冪等）。
 * 追記・nullable なので非破壊。dev/prod 共有 DB でも安全。
 * 実行: npx tsx scripts/add-launch-goal-columns.ts
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const db = createDbClient(process.env.DATABASE_URL)

  await db.execute(
    sql`ALTER TABLE launchia_projects ADD COLUMN IF NOT EXISTS launch_target_date date`,
  )
  await db.execute(
    sql`ALTER TABLE launchia_projects ADD COLUMN IF NOT EXISTS goal_count integer`,
  )

  const cols = await db.execute(sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'launchia_projects'
      AND column_name IN ('launch_target_date', 'goal_count')
    ORDER BY column_name
  `)
  const rows = (cols as unknown as { rows?: unknown[] }).rows ?? cols
  console.log('追加後の列:', JSON.stringify(rows))
  console.log('done')
}

main().catch((err) => {
  console.error('migration failed:', err)
  process.exit(1)
})
