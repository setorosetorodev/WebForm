import type { Metadata } from 'next'
import { AdminChrome } from '../../projects/admin-chrome'
import { DashboardView, type DashProject, type Overview } from '../../projects/dashboard-view'
import { LogoutButton } from '../../projects/logout-button'

/**
 * ダッシュボードのデモプレビュー（認証なし・スクショ/見栄え確認用）。
 * 本物の `/projects` と同じ DashboardView を、賑やかしのデモデータで描画する。
 * 本番DBは一切触らない（鶏卵回避）。ヒーロー画像の素材用。
 * 日付は 2026-06-02 基準で相対設定。
 */
export const metadata: Metadata = {
  title: 'Launchia ダッシュボード（デモプレビュー）',
}

const overview: Overview = {
  totalActive: 1287,
  confirmed: 1102,
  pending: 185,
  todayNew: 37,
  weekNew: 214,
  prevWeekNew: 168,
  rankViews: 3942,
}

const projects: DashProject[] = [
  {
    id: 'demo-1',
    slug: 'dasune',
    name: 'だすね',
    description: null,
    embedEnabled: true,
    ideaPagePublic: true,
    createdAt: '',
    launchTargetDate: '2026-07-14', // +42日
    goalCount: 1000,
    stats: { total: 687, confirmed: 612, pending: 75, todayNew: 23, daily: [5, 9, 12, 8, 21, 17, 23] },
  },
  {
    id: 'demo-2',
    slug: 'snapnote',
    name: 'SnapNote',
    description: null,
    embedEnabled: true,
    ideaPagePublic: false,
    createdAt: '',
    launchTargetDate: '2026-06-14', // +12日
    goalCount: 200,
    stats: { total: 431, confirmed: 402, pending: 29, todayNew: 8, daily: [12, 7, 9, 15, 6, 11, 8] },
  },
  {
    id: 'demo-3',
    slug: 'orbit-cli',
    name: 'Orbit CLI',
    description: null,
    embedEnabled: true,
    ideaPagePublic: true,
    createdAt: '',
    launchTargetDate: '2026-08-31', // +90日
    goalCount: 2000,
    stats: { total: 169, confirmed: 88, pending: 81, todayNew: 6, daily: [2, 0, 4, 3, 7, 5, 6] },
  },
  {
    id: 'demo-4',
    slug: 'devping',
    name: 'DevPing',
    description: null,
    embedEnabled: true,
    ideaPagePublic: false,
    createdAt: '',
    launchTargetDate: null,
    goalCount: null,
    stats: { total: 142, confirmed: 120, pending: 22, todayNew: 0, daily: [3, 4, 2, 5, 1, 3, 0] },
  },
]

export default async function DashboardPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  const { theme } = await searchParams
  const content = (
    <AdminChrome email="dev@launchia.net" actions={<LogoutButton />}>
      <DashboardView projects={projects} overview={overview} />
    </AdminChrome>
  )
  // スクショ用: ?theme=dark でこのサブツリーを .dark に（headless で localStorage が効かないため）
  return theme === 'dark' ? <div className="dark">{content}</div> : content
}
