import { apiJson } from '@/lib/api'
import { DashboardView, type DashProject, type Overview } from './dashboard-view'

const emptyOverview: Overview = {
  totalActive: 0,
  confirmed: 0,
  pending: 0,
  todayNew: 0,
  weekNew: 0,
  prevWeekNew: 0,
  rankViews: 0,
}

export default async function ProjectsPage() {
  const data = await apiJson<{ projects: DashProject[]; overview: Overview }>(
    '/api/v1/admin/projects',
  )
  return (
    <DashboardView
      projects={data?.projects ?? []}
      overview={data?.overview ?? emptyOverview}
    />
  )
}
