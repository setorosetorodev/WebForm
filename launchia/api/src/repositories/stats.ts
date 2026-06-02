import { sql } from 'drizzle-orm'
import type { DbClient } from '../db/client'

/**
 * ダッシュボード用の集計。すべて owner 単位（launchia_projects.owner_user_id）。
 * 「今日」「今週」は JST(Asia/Tokyo) 基準。created_at は timestamptz(UTC) 保存。
 * 解除(deleted_at)は active から除外。rank_views はエンゲージメント指標。
 */

// neon-http の db.execute は環境により配列 or { rows } を返すので吸収する
function toRows<T = Record<string, unknown>>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const maybe = res as { rows?: unknown[] }
  return (maybe?.rows ?? []) as T[]
}

const n = (v: unknown): number => Number(v ?? 0)

export type OwnerOverview = {
  totalActive: number
  confirmed: number
  pending: number
  todayNew: number
  weekNew: number
  prevWeekNew: number
  rankViews: number
}

export async function getOverviewForOwner(
  db: DbClient,
  ownerId: string,
): Promise<OwnerOverview> {
  const aggRes = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL) AS total_active,
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL AND e.confirmed_at IS NOT NULL) AS confirmed,
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL
        AND (e.created_at AT TIME ZONE 'Asia/Tokyo')::date = (now() AT TIME ZONE 'Asia/Tokyo')::date) AS today_new,
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL AND e.created_at >= now() - interval '7 days') AS week_new,
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL
        AND e.created_at >= now() - interval '14 days' AND e.created_at < now() - interval '7 days') AS prev_week_new
    FROM launchia_waitlist_entries e
    JOIN launchia_projects p ON e.project_id = p.id
    WHERE p.owner_user_id = ${ownerId}
  `)
  const a = toRows(aggRes)[0] ?? {}

  const rvRes = await db.execute(sql`
    SELECT COUNT(*) AS rank_views
    FROM launchia_rank_views rv
    JOIN launchia_waitlist_entries e ON rv.entry_id = e.id
    JOIN launchia_projects p ON e.project_id = p.id
    WHERE p.owner_user_id = ${ownerId}
  `)
  const rv = toRows(rvRes)[0] ?? {}

  const totalActive = n(a.total_active)
  const confirmed = n(a.confirmed)
  return {
    totalActive,
    confirmed,
    pending: totalActive - confirmed,
    todayNew: n(a.today_new),
    weekNew: n(a.week_new),
    prevWeekNew: n(a.prev_week_new),
    rankViews: n(rv.rank_views),
  }
}

export type ProjectStats = {
  total: number
  confirmed: number
  pending: number
  todayNew: number
  /** 直近7日の日別新規（古い→新しい、長さ7） */
  daily: number[]
}

/**
 * owner の全プロジェクトについて、件数(total/confirmed/today) と 直近7日の日別新規をまとめて返す。
 * 戻り値は projectId -> ProjectStats のマップ。
 */
export async function getProjectStatsForOwner(
  db: DbClient,
  ownerId: string,
): Promise<Record<string, ProjectStats>> {
  const countsRes = await db.execute(sql`
    SELECT e.project_id AS project_id,
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL) AS total,
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL AND e.confirmed_at IS NOT NULL) AS confirmed,
      COUNT(*) FILTER (WHERE e.deleted_at IS NULL
        AND (e.created_at AT TIME ZONE 'Asia/Tokyo')::date = (now() AT TIME ZONE 'Asia/Tokyo')::date) AS today_new
    FROM launchia_waitlist_entries e
    JOIN launchia_projects p ON e.project_id = p.id
    WHERE p.owner_user_id = ${ownerId}
    GROUP BY e.project_id
  `)

  const dailyRes = await db.execute(sql`
    SELECT e.project_id AS project_id,
      (e.created_at AT TIME ZONE 'Asia/Tokyo')::date AS d,
      COUNT(*) AS c
    FROM launchia_waitlist_entries e
    JOIN launchia_projects p ON e.project_id = p.id
    WHERE p.owner_user_id = ${ownerId}
      AND e.deleted_at IS NULL
      AND e.created_at >= now() - interval '7 days'
    GROUP BY e.project_id, d
  `)

  // 直近7日の JST 日付キー（古い→新しい）
  const days: string[] = []
  const today = new Date(Date.now() + 9 * 3600 * 1000) // UTC+9 近似
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(today.getTime() - i * 86400000)
    days.push(dt.toISOString().slice(0, 10))
  }

  const map: Record<string, ProjectStats> = {}
  for (const row of toRows(countsRes)) {
    const pid = String(row.project_id)
    const total = n(row.total)
    const confirmed = n(row.confirmed)
    map[pid] = {
      total,
      confirmed,
      pending: total - confirmed,
      todayNew: n(row.today_new),
      daily: new Array(7).fill(0),
    }
  }
  for (const row of toRows(dailyRes)) {
    const pid = String(row.project_id)
    if (!map[pid]) continue
    const key = String(row.d).slice(0, 10)
    const idx = days.indexOf(key)
    if (idx >= 0) map[pid].daily[idx] = n(row.c)
  }
  return map
}
