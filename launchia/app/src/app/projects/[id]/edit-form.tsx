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
  launchTargetDate: string | null
  goalCount: number | null
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
  const [launchTargetDate, setLaunchTargetDate] = useState(project.launchTargetDate ?? '')
  const [goalCount, setGoalCount] = useState(
    project.goalCount != null ? String(project.goalCount) : '',
  )
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
          launch_target_date: launchTargetDate || null,
          goal_count: goalCount ? Number(goalCount) : null,
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
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">プロジェクト名</label>
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">説明文</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
          カバー画像 URL <span className="neo-body text-xs text-neo-fg-faint font-normal">(任意)</span>
        </label>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://example.com/cover.png"
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
          LP URL <span className="neo-body text-xs text-neo-fg-faint font-normal">(自社 LP がある場合)</span>
        </label>
        <input
          type="url"
          value={landingPageUrl}
          onChange={(e) => setLandingPageUrl(e.target.value)}
          placeholder="https://dasune.net"
          className="neo-input"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
            リリース予定日 <span className="neo-body text-xs text-neo-fg-faint font-normal">(任意)</span>
          </label>
          <input
            type="date"
            value={launchTargetDate}
            onChange={(e) => setLaunchTargetDate(e.target.value)}
            className="neo-input"
          />
        </div>
        <div>
          <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
            目標登録数 <span className="neo-body text-xs text-neo-fg-faint font-normal">(任意)</span>
          </label>
          <input
            type="number"
            min={1}
            value={goalCount}
            onChange={(e) => setGoalCount(e.target.value)}
            placeholder="例: 1000"
            className="neo-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ideaPagePublic}
            onChange={(e) => setIdeaPagePublic(e.target.checked)}
            className="w-4 h-4 accent-neo-primary"
          />
          <span className="neo-body text-sm text-neo-fg-soft">アイデアページを公開する</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={embedEnabled}
            onChange={(e) => setEmbedEnabled(e.target.checked)}
            className="w-4 h-4 accent-neo-primary"
          />
          <span className="neo-body text-sm text-neo-fg-soft">埋め込みウィジェットを有効にする</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={requireConsent}
            onChange={(e) => setRequireConsent(e.target.checked)}
            className="w-4 h-4 accent-neo-primary"
          />
          <span className="neo-body text-sm text-neo-fg-soft">プライバシーポリシー同意を必須にする</span>
        </label>
      </div>

      <div>
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
          埋め込み許可ドメイン{' '}
          <span className="neo-body text-xs text-neo-fg-faint font-normal">(1 行 1 URL、空なら全許可)</span>
        </label>
        <textarea
          value={allowedOrigins}
          onChange={(e) => setAllowedOrigins(e.target.value)}
          rows={3}
          placeholder={'https://dasune.net\nhttps://www.dasune.net'}
          className="neo-input neo-code text-sm"
        />
      </div>

      {errorMessage && (
        <div className="bg-neo-danger-soft border-2 border-neo-danger rounded-xl p-3 neo-body text-sm text-neo-danger">
          {errorMessage}
        </div>
      )}
      {status === 'saved' && (
        <div className="bg-neo-green-soft border-2 border-neo-green rounded-xl p-3 neo-body text-sm text-neo-on-green-soft">
          ✓ 保存しました
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="neo-btn bg-neo-primary text-neo-on-primary text-sm rounded-xl px-6 py-2.5"
      >
        {status === 'submitting' ? '保存中...' : '変更を保存'}
      </button>
    </form>
  )
}
