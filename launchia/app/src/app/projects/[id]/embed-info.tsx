'use client'

import { useState } from 'react'

type Project = {
  slug: string
  embedEnabled: boolean
  ideaPagePublic: boolean
}

const WIDGET_SRC =
  process.env.NEXT_PUBLIC_WIDGET_SRC ?? 'https://widget.launchia.net/launchia-widget.js'
const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.launchia.net'
const IDEA_PAGE_BASE =
  process.env.NEXT_PUBLIC_IDEA_PAGE_BASE ?? 'https://launchia.net'

export function EmbedInfo({ project }: { project: Project }) {
  const [copied, setCopied] = useState<string | null>(null)

  const ideaUrl = `${IDEA_PAGE_BASE}/p/${project.slug}`
  const embedSnippet = `<script type="module" src="${WIDGET_SRC}"></script>
<launchia-widget
  project-slug="${project.slug}"
  api-url="${PUBLIC_API_URL}">
</launchia-widget>`

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // clipboard API failure (insecure context etc); ignore
    }
  }

  if (!project.embedEnabled && !project.ideaPagePublic) {
    return (
      <div className="bg-warning-soft border border-warning rounded-xl p-4 text-sm text-warning">
        埋め込みもアイデア公開も無効です。下の設定からどちらかを有効にしてください。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {project.ideaPagePublic && (
        <div className="bg-card rounded-xl p-5 border border-line">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-fg text-sm">
              アイデアページ URL
            </h3>
            <button
              type="button"
              onClick={() => copy(ideaUrl, 'idea')}
              className="text-xs px-3 py-1 rounded bg-primary-soft text-on-primary-soft hover:opacity-80"
            >
              {copied === 'idea' ? '✓ コピーしました' : 'コピー'}
            </button>
          </div>
          <code className="block bg-muted rounded p-3 text-xs font-mono text-fg-soft break-all">
            {ideaUrl}
          </code>
        </div>
      )}

      {project.embedEnabled && (
        <div className="bg-card rounded-xl p-5 border border-line">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-fg text-sm">LP 埋め込みコード</h3>
            <button
              type="button"
              onClick={() => copy(embedSnippet, 'embed')}
              className="text-xs px-3 py-1 rounded bg-primary-soft text-on-primary-soft hover:opacity-80"
            >
              {copied === 'embed' ? '✓ コピーしました' : 'コピー'}
            </button>
          </div>
          <pre className="bg-muted rounded p-3 text-xs font-mono text-fg-soft overflow-x-auto whitespace-pre">
            {embedSnippet}
          </pre>
          <p className="text-xs text-fg-soft mt-2">
            自社 LP の HTML に貼り付けてください。
          </p>
        </div>
      )}
    </div>
  )
}
