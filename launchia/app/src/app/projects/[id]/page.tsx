import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { EditForm } from './edit-form'
import { EmbedInfo } from './embed-info'

type ProjectData = {
  project: {
    id: string
    slug: string
    name: string
    description: string | null
    coverImageUrl: string | null
    landingPageUrl: string | null
    embedEnabled: boolean
    ideaPagePublic: boolean
    requireConsent: boolean
    allowedOrigins: string[]
    launchTargetDate: string | null
    goalCount: number | null
    createdAt: string
  }
  counts: { total: number; confirmed: number; pending: number }
}

export default async function ProjectDetailPage(props: PageProps<'/projects/[id]'>) {
  const { id } = await props.params
  const data = await apiJson<ProjectData>(`/api/v1/admin/projects/${id}`)
  if (!data) notFound()
  const { project, counts } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="neo-code text-sm text-neo-fg-soft hover:text-neo-primary mb-4 inline-block"
      >
        ← プロジェクト一覧へ
      </Link>

      <div className="mb-6">
        <h1 className="neo-display text-3xl text-neo-fg mb-1">{project.name}</h1>
        <div className="neo-code text-xs text-neo-fg-faint">slug: {project.slug}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-neo-card neo-card rounded-xl p-4 text-center">
          <div className="neo-display text-3xl text-neo-green">{counts.confirmed}</div>
          <div className="neo-body text-xs text-neo-fg-soft mt-0.5">確認済み登録</div>
        </div>
        <div className="bg-neo-card neo-card rounded-xl p-4 text-center">
          <div className="neo-display text-3xl text-neo-orange">{counts.pending}</div>
          <div className="neo-body text-xs text-neo-fg-soft mt-0.5">確認待ち</div>
        </div>
        <Link
          href={`/projects/${project.id}/entries`}
          className="bg-neo-card neo-card neo-card-link rounded-xl p-4 flex flex-col items-center justify-center"
        >
          <div className="neo-label text-sm text-neo-fg">登録者一覧</div>
          <div className="neo-code text-xs text-neo-primary mt-1">→ 開く</div>
        </Link>
      </div>

      <EmbedInfo project={project} />

      <div className="mt-8 bg-neo-card neo-card rounded-2xl p-6">
        <h2 className="neo-headline text-neo-fg mb-4">プロジェクト設定</h2>
        <EditForm project={project} />
      </div>
    </div>
  )
}
