import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { EuStyle } from '../../eu-style'
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
    <main className="eu min-h-screen bg-eu-bg">
      <EuStyle />
      <header className="bg-eu-bg border-b-[3px] border-eu-ink sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="https://launchia.net" className="eu-head text-lg text-eu-primary">
            Launchia<span className="text-eu-accent">.</span>
          </a>
          <a
            href="https://launchia.net"
            className="eu-body text-xs text-eu-fg-soft hover:text-eu-fg"
          >
            Launchia とは？
          </a>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {data.cover_image_url && (
          <div className="eu-neo bg-eu-surface rounded-2xl overflow-hidden mb-8 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.cover_image_url}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="eu-display text-3xl md:text-4xl text-eu-fg mb-4">{data.name}</h1>

        {data.description && (
          <div className="eu-body text-eu-fg-soft mb-8 whitespace-pre-wrap">
            {data.description}
          </div>
        )}

        {data.landing_page_url && (
          <a
            href={data.landing_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="eu-code inline-flex items-center gap-1 text-sm text-eu-primary hover:underline mb-10"
          >
            プロジェクトの LP を見る →
          </a>
        )}

        <div className="eu-neo bg-eu-card rounded-2xl p-6 md:p-8 mt-12">
          <h2 className="eu-head text-lg text-eu-fg mb-2">リリースを待ちますか？</h2>
          <p className="eu-body text-sm text-eu-fg-soft mb-6">
            ウェイトリストに登録すると、リリース時に通知が届きます。
          </p>
          <RegistrationCta
            projectSlug={data.slug}
            projectName={data.name}
            requireConsent={data.require_consent}
          />
        </div>
      </article>

      <footer className="bg-eu-surface border-t-[3px] border-eu-ink mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-between eu-code text-xs text-eu-fg-faint">
          <div>Powered by Launchia</div>
          <a href="/privacy" className="hover:text-eu-fg-soft">
            プライバシーポリシー
          </a>
        </div>
      </footer>
    </main>
  )
}
