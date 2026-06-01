'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type Project = {
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
}

type Status = 'idle' | 'submitting' | 'saved' | 'error'

export function EditForm({ project }: { project: Project }) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(project.coverImageUrl ?? '')
  const [landingPageUrl, setLandingPageUrl] = useState(project.landingPageUrl ?? '')
  const [embedEnabled, setEmbedEnabled] = useState(project.embedEnabled)
  const [ideaPagePublic, setIdeaPagePublic] = useState(project.ideaPagePublic)
  const [requireConsent, setRequireConsent] = useState(project.requireConsent)
  const [allowedOrigins, setAllowedOrigins] = useState(
    (project.allowedOrigins ?? []).join('\n'),
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const origins = allowedOrigins
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    try {
      const res = await fetch(`/api/v1/admin/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          cover_image_url: coverImageUrl || null,
          landing_page_url: landingPageUrl || null,
          embed_enabled: embedEnabled,
          idea_page_public: ideaPagePublic,
          require_consent: requireConsent,
          allowed_origins: origins,
        }),
      })

      if (res.ok) {
        setStatus('saved')
        router.refresh()
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setErrorMessage(
          data.error === 'validation_failed' ? '入力内容に誤りがあります。' : '保存に失敗しました。',
        )
        setStatus('error')
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">プロジェクト名</label>
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">説明文</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          カバー画像 URL <span className="text-xs text-gray-500 font-normal">(任意)</span>
        </label>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://example.com/cover.png"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          LP URL <span className="text-xs text-gray-500 font-normal">(自社 LP がある場合)</span>
        </label>
        <input
          type="url"
          value={landingPageUrl}
          onChange={(e) => setLandingPageUrl(e.target.value)}
          placeholder="https://dasune.net"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ideaPagePublic}
            onChange={(e) => setIdeaPagePublic(e.target.checked)}
            className="w-4 h-4 accent-brand-600"
          />
          <span className="text-sm text-gray-700">アイデアページを公開する</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={embedEnabled}
            onChange={(e) => setEmbedEnabled(e.target.checked)}
            className="w-4 h-4 accent-brand-600"
          />
          <span className="text-sm text-gray-700">埋め込みウィジェットを有効にする</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={requireConsent}
            onChange={(e) => setRequireConsent(e.target.checked)}
            className="w-4 h-4 accent-brand-600"
          />
          <span className="text-sm text-gray-700">プライバシーポリシー同意を必須にする</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          埋め込み許可ドメイン{' '}
          <span className="text-xs text-gray-500 font-normal">(1 行 1 URL、空なら全許可)</span>
        </label>
        <textarea
          value={allowedOrigins}
          onChange={(e) => setAllowedOrigins(e.target.value)}
          rows={3}
          placeholder={'https://dasune.net\nhttps://www.dasune.net'}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-mono text-sm"
        />
      </div>

      {errorMessage && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
          {errorMessage}
        </div>
      )}
      {status === 'saved' && (
        <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3 border border-green-200">
          ✓ 保存しました
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
      >
        {status === 'submitting' ? '保存中...' : '変更を保存'}
      </button>
    </form>
  )
}
