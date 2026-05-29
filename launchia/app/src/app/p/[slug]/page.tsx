import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RegistrationCta } from './registration-cta'

type ProjectIdeaData = {
  slug: string
  name: string
  description: string | null
  cover_image_url: string | null
  landing_page_url: string | null
  require_consent: boolean
}

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:8788'

async function fetchProject(slug: string): Promise<ProjectIdeaData | null> {
  try {
    const res = await fetch(
      `${INTERNAL_API_URL}/api/v1/public/projects/${encodeURIComponent(slug)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    return (await res.json()) as ProjectIdeaData
  } catch {
    return null
  }
}

export async function generateMetadata(
  props: PageProps<'/p/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params
  const data = await fetchProject(slug)
  if (!data) return { title: 'プロジェクトが見つかりません｜Launchia ウェイトリスト' }

  const title = `${data.name}｜Launchia ウェイトリスト`
  const description =
    data.description?.slice(0, 160) ?? `${data.name} のウェイトリストに登録しましょう。`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.cover_image_url ? [data.cover_image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: data.cover_image_url ? [data.cover_image_url] : undefined,
    },
  }
}

export default async function IdeaPage(props: PageProps<'/p/[slug]'>) {
  const { slug } = await props.params
  const data = await fetchProject(slug)
  if (!data) notFound()

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href="https://launchia.net"
            className="text-sm font-bold tracking-tight text-gray-900"
          >
            Launchia
          </a>
          <a
            href="https://launchia.net"
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Launchia とは？
          </a>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {data.cover_image_url && (
          <div className="rounded-2xl overflow-hidden bg-gray-100 mb-8 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.cover_image_url}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
          {data.name}
        </h1>

        {data.description && (
          <div className="text-gray-700 mb-8 whitespace-pre-wrap leading-relaxed">
            {data.description}
          </div>
        )}

        {data.landing_page_url && (
          <a
            href={data.landing_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-10"
          >
            プロジェクトの LP を見る →
          </a>
        )}

        <div className="mt-12 bg-blue-50 rounded-2xl p-6 md:p-8 border border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">リリースを待ちますか？</h2>
          <p className="text-sm text-gray-600 mb-6">
            ウェイトリストに登録すると、リリース時に通知が届きます。
          </p>
          <RegistrationCta
            projectSlug={data.slug}
            projectName={data.name}
            requireConsent={data.require_consent}
          />
        </div>
      </article>

      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-between text-xs text-gray-400">
          <div>Powered by Launchia</div>
          <a href="https://launchia.net/privacy" className="hover:text-gray-600">
            プライバシーポリシー
          </a>
        </div>
      </footer>
    </main>
  )
}
