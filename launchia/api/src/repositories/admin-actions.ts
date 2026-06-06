import { and, desc, eq, gte, inArray } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import type { Env } from '../env'
import { adminActions, users, type AdminAction } from '../db/schema'
import { encryptEmail } from '../lib/audit-crypto'

export type ActorRole = 'developer' | 'system_admin'

export type RecordAdminActionInput = {
  actorUserId: string | null
  actorRole: ActorRole
  action: string
  projectId?: string | null
  targetType?: string | null
  targetId?: string | null
  /** 平文メール。可逆暗号化して保存する（平文は保存しない）。 */
  targetEmail?: string | null
  metadata?: Record<string, unknown> | null
}

/** 管理操作を監査ログに 1 行記録する。宛先メールは暗号化して保存。 */
export async function recordAdminAction(
  db: DbClient,
  env: Env,
  input: RecordAdminActionInput,
): Promise<void> {
  const targetEmailEnc = await encryptEmail(env, input.targetEmail)
  await db.insert(adminActions).values({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: input.action,
    projectId: input.projectId ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    targetEmailEnc,
    metadata: input.metadata ?? null,
  })
}

/** 直近 windowMinutes 分以内に同 targetId への指定アクションが既にあるか（R3 クールダウン）。 */
export async function hasRecentAction(
  db: DbClient,
  targetId: string,
  actions: string[],
  windowMinutes: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60_000)
  const [row] = await db
    .select({ id: adminActions.id })
    .from(adminActions)
    .where(
      and(
        eq(adminActions.targetId, targetId),
        inArray(adminActions.action, actions),
        gte(adminActions.createdAt, since),
      ),
    )
    .limit(1)
  return !!row
}

export type AdminActionListItem = {
  id: string
  actorUserId: string | null
  actorEmail: string | null
  actorRole: string
  action: string
  projectId: string | null
  targetType: string | null
  targetId: string | null
  targetEmailEnc: string | null
  metadata: unknown
  createdAt: Date
}

/** 監査ログ一覧（システム管理者の閲覧用。新しい順）。actor のメールを join。宛先は暗号文のまま返す。 */
export async function listAdminActionsWithActor(
  db: DbClient,
  opts: { limit: number; offset: number },
): Promise<AdminActionListItem[]> {
  return db
    .select({
      id: adminActions.id,
      actorUserId: adminActions.actorUserId,
      actorEmail: users.email,
      actorRole: adminActions.actorRole,
      action: adminActions.action,
      projectId: adminActions.projectId,
      targetType: adminActions.targetType,
      targetId: adminActions.targetId,
      targetEmailEnc: adminActions.targetEmailEnc,
      metadata: adminActions.metadata,
      createdAt: adminActions.createdAt,
    })
    .from(adminActions)
    .leftJoin(users, eq(adminActions.actorUserId, users.id))
    .orderBy(desc(adminActions.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)
}

/** 1 件取得（宛先の復号表示用）。 */
export async function findAdminActionById(
  db: DbClient,
  id: string,
): Promise<AdminAction | null> {
  const [row] = await db.select().from(adminActions).where(eq(adminActions.id, id)).limit(1)
  return row ?? null
}
