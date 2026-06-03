'use client'

import { useState, type FormEvent } from 'react'

type State = 'idle' | 'submitting' | 'sent' | 'error'

export function ApplyForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // ハニーポット
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/v1/public/invite-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          project_name: projectName || undefined,
          url: url || undefined,
          message: message || undefined,
          company: company || undefined,
        }),
      })

      if (res.ok) {
        setState('sent')
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setErrorMessage(
          data.error === 'validation_failed'
            ? '入力内容をご確認ください（メール形式・URL など）。'
            : '送信に失敗しました。時間をおいて再度お試しください。',
        )
        setState('error')
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。')
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">📨</div>
        <div className="neo-headline text-base text-neo-fg mb-2">申請を受け付けました</div>
        <p className="neo-body text-sm text-neo-fg-soft leading-relaxed">
          運営が確認のうえ、ご記入のメールアドレスに招待コードをお送りします。
          <br />
          少々お待ちください。
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* ハニーポット（スクリーンリーダー/人間からは隠す） */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="hidden"
      />

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1.5 block">
          メールアドレス <span className="text-neo-danger">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="dev@example.com"
          disabled={state === 'submitting'}
          autoComplete="email"
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1.5 block">
          お名前 / ハンドル <span className="text-neo-fg-faint font-normal">(任意)</span>
        </label>
        <input
          type="text"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={state === 'submitting'}
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1.5 block">
          作っているプロダクト <span className="text-neo-fg-faint font-normal">(任意)</span>
        </label>
        <input
          type="text"
          maxLength={200}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={state === 'submitting'}
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1.5 block">
          URL <span className="text-neo-fg-faint font-normal">(任意)</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          disabled={state === 'submitting'}
          className="neo-input neo-code text-sm"
        />
      </div>

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1.5 block">
          ひとこと <span className="text-neo-fg-faint font-normal">(任意)</span>
        </label>
        <textarea
          rows={3}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="どんなものを作っていますか？ どう使いたいですか？"
          disabled={state === 'submitting'}
          className="neo-input"
        />
      </div>

      {state === 'error' && (
        <div className="bg-neo-danger-soft border-2 border-neo-danger rounded-xl p-3 neo-body text-sm text-neo-danger">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="neo-btn w-full bg-neo-primary text-neo-on-primary rounded-xl py-3"
      >
        {state === 'submitting' ? '送信中...' : '申請を送信する'}
      </button>
    </form>
  )
}
