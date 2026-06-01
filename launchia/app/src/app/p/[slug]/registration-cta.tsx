'use client'

import { useState, type FormEvent } from 'react'

type Props = {
  projectSlug: string
  projectName: string
  requireConsent: boolean
}

type State = 'idle' | 'submitting' | 'pending' | 'resent' | 'already' | 'error'

export function RegistrationCta({
  projectSlug,
  projectName,
  requireConsent,
}: Props) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [rank, setRank] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [consentError, setConsentError] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setConsentError(false)

    if (requireConsent && !consent) {
      setConsentError(true)
      return
    }

    setState('submitting')
    try {
      const res = await fetch(
        `/api/v1/public/projects/${encodeURIComponent(projectSlug)}/entries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            consent: requireConsent ? consent : undefined,
            source: 'idea_page',
          }),
        },
      )
      const data = (await res.json().catch(() => ({}))) as {
        rank?: number
        status?: 'pending_confirmation' | 'confirmation_resent'
        error?: string
      }

      if (res.status === 201 && data.status === 'pending_confirmation') {
        setState('pending')
      } else if (res.status === 200 && data.status === 'confirmation_resent') {
        setState('resent')
      } else if (res.status === 409 && data.error === 'already_registered') {
        setRank(data.rank ?? 0)
        setState('already')
      } else if (res.status === 400 && data.error === 'consent_required') {
        setConsentError(true)
        setState('idle')
      } else if (res.status === 400 && data.error === 'validation_failed') {
        setErrorMessage('メールアドレスの形式が正しくありません。example@domain.com の形式で入力してください。')
        setState('error')
      } else if (res.status === 403) {
        setErrorMessage('このページから登録できません。サイト管理者にお問い合わせください。')
        setState('error')
      } else if (res.status === 404) {
        setErrorMessage('ウェイトリストが見つかりません。')
        setState('error')
      } else {
        setErrorMessage('登録に失敗しました。時間をおいて再度お試しください。')
        setState('error')
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。')
      setState('error')
    }
  }

  if (state === 'pending' || state === 'resent') {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">📧</div>
        <div className="text-sm font-semibold text-fg mb-2">
          {state === 'pending'
            ? '確認メールを送信しました'
            : '確認メールを再送しました'}
        </div>
        <div className="text-xs text-fg-soft leading-relaxed">
          メール内のリンクをクリックして、登録を完了してください。
          <br />
          クリック後、あなたの順位が確定し表示されます。
        </div>
      </div>
    )
  }

  if (state === 'already') {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <div className="text-sm font-semibold text-fg mb-1">
          すでに {projectName} に登録済みです
        </div>
        <div className="mt-3">
          <span className="text-4xl font-extrabold text-primary">{rank}</span>
          <span className="text-lg font-semibold text-primary ml-1">番目</span>
        </div>
        <div className="text-xs text-fg-soft mt-2">
          確認メール内の URL から、いつでも順位を確認できます。
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="email"
        required
        pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
        title="example@domain.com の形式で入力してください"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        disabled={state === 'submitting'}
        autoComplete="email"
        className="w-full px-4 py-3 rounded-lg border border-line-strong focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft disabled:opacity-50 invalid:border-danger"
      />

      {requireConsent && (
        <>
          <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                if (e.target.checked) setConsentError(false)
              }}
              className="w-4 h-4 accent-primary"
            />
            <span>
              <a
                href="https://launchia.net/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                プライバシーポリシー
              </a>
              に同意する
            </span>
          </label>
          {consentError && (
            <div className="text-xs text-danger pl-6">
              プライバシーポリシーへの同意が必要です。
            </div>
          )}
        </>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full px-4 py-3 bg-primary hover:bg-primary-hover text-on-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? '送信中...' : 'ウェイトリストに登録'}
      </button>

      {state === 'error' && (
        <div className="text-sm text-danger text-center">{errorMessage}</div>
      )}
    </form>
  )
}
