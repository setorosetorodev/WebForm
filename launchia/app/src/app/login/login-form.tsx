'use client'

import { useState, type FormEvent } from 'react'

type State = 'idle' | 'submitting' | 'sent' | 'error'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/v1/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          invite_code: inviteCode || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (res.ok) {
        setState('sent')
      } else if (res.status === 400 && data.error === 'invite_code_required') {
        setErrorMessage('新規ご利用には招待コードが必要です。')
        setState('error')
      } else if (res.status === 400 && data.error === 'invalid_invite_code') {
        setErrorMessage('招待コードが無効または期限切れです。')
        setState('error')
      } else if (res.status === 400 && data.error === 'validation_failed') {
        setErrorMessage('メールアドレスの形式が正しくありません。')
        setState('error')
      } else {
        setErrorMessage('送信に失敗しました。時間をおいて再度お試しください。')
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
        <div className="text-4xl mb-3">📧</div>
        <div className="text-base font-semibold text-gray-900 mb-2">
          ログインリンクを送信しました
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">
          メール内のリンクをクリックしてログインを完了してください。
          <br />
          リンクは <strong>15 分間</strong> 有効です。
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          メールアドレス
        </label>
        <input
          type="email"
          required
          pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
          title="example@domain.com の形式で入力してください"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="dev@example.com"
          disabled={state === 'submitting'}
          autoComplete="email"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 invalid:border-red-300"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          招待コード <span className="text-gray-400 font-normal">(新規ご利用のみ)</span>
        </label>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="LCHA-XXXX-XXXX"
          disabled={state === 'submitting'}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 font-mono text-sm"
        />
      </div>

      {state === 'error' && (
        <div className="text-sm text-red-600 text-center">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? '送信中...' : 'ログインリンクを送信'}
      </button>
    </form>
  )
}
