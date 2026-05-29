import type { DbClient } from '../db/client'
import { rankViews } from '../db/schema'

export async function recordView(
  db: DbClient,
  entryId: string,
  userAgentHash: Uint8Array | null,
): Promise<void> {
  await db.insert(rankViews).values({
    entryId,
    userAgentHash,
  })
}
