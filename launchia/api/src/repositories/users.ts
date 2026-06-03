import { eq } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { users, type User } from '../db/schema'

export async function findUserByEmail(db: DbClient, email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user ?? null
}

export async function findUserById(db: DbClient, id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
}

export async function createUser(
  db: DbClient,
  email: string,
  displayName?: string | null,
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ email, displayName: displayName ?? null })
    .returning()
  return user
}

/** 運営者フラグの付与/解除（bootstrap・運営者管理用）。 */
export async function setUserAdmin(
  db: DbClient,
  email: string,
  isAdmin: boolean,
): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set({ isAdmin, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning()
  return user ?? null
}
