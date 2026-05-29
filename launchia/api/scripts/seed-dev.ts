import 'dotenv/config'
import { eq, sql } from 'drizzle-orm'
import { createDbClient } from '../src/db/client'
import { inviteCodes, projects, users, waitlistEntries } from '../src/db/schema'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const db = createDbClient(process.env.DATABASE_URL)

  let user = (
    await db.select().from(users).where(eq(users.email, 'dev@example.com')).limit(1)
  )[0]

  if (!user) {
    ;[user] = await db
      .insert(users)
      .values({ email: 'dev@example.com', displayName: 'Dev User' })
      .returning()
    console.log('Created user:', user.email, user.id)
  } else {
    console.log('Found user:', user.email, user.id)
  }

  let project = (
    await db.select().from(projects).where(eq(projects.slug, 'dasune-test')).limit(1)
  )[0]

  if (!project) {
    ;[project] = await db
      .insert(projects)
      .values({
        ownerUserId: user.id,
        slug: 'dasune-test',
        name: 'だすね（テスト）',
        description: 'M2 動作確認用のテストプロジェクト',
        embedEnabled: true,
        ideaPagePublic: true,
        requireConsent: false,
        allowedOrigins: [],
      })
      .returning()
    console.log('Created project:', project.slug, project.id)
  } else {
    console.log('Found project:', project.slug, project.id)
  }

  // dev backfill: 既存の active エントリを confirmed_at = NOW() に
  // (M6.5 ダブルオプトイン導入時、それ以前のテストデータを救済するため)
  const backfilled = await db.execute(sql`
    UPDATE ${waitlistEntries}
    SET confirmed_at = NOW(), updated_at = NOW()
    WHERE confirmed_at IS NULL AND deleted_at IS NULL
    RETURNING id
  `)
  const rows = (backfilled as unknown as { rows?: unknown[] }).rows ?? backfilled
  const count = Array.isArray(rows) ? rows.length : 0
  console.log(`Backfilled confirmed_at for ${count} existing active entries`)

  // 開発用の招待コード
  let invite = (
    await db.select().from(inviteCodes).where(eq(inviteCodes.code, 'LCHA-DEV-1111')).limit(1)
  )[0]
  if (!invite) {
    ;[invite] = await db
      .insert(inviteCodes)
      .values({
        code: 'LCHA-DEV-1111',
        maxUses: 100,
        notes: 'dev seed (M7 phase A)',
      })
      .returning()
    console.log(`Created invite code: ${invite.code} (max ${invite.maxUses} uses)`)
  } else {
    console.log(`Found invite code: ${invite.code} (used ${invite.usedCount}/${invite.maxUses})`)
  }

  console.log('\n=== Seed completed ===')
  console.log(`Project slug: ${project.slug}`)
  console.log(`Project ID: ${project.id}`)
  console.log(`Owner user ID: ${user.id}`)
  console.log(`Invite code: ${invite.code}`)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
