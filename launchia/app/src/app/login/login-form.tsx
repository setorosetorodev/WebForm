'use client'

import { useEffect, useState, type FormEvent } from 'react'

type State = 'idle' | 'submitting' | 'sent' | 'error'

const RESEND_COOLDOWN_SEC = 60

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // 再送信クールダウンのカウントダウン
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (state === 'submitting') return
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
        setSentTo(email)
        setState('sent')
        setCooldown(RESEND_COOLDOWN_SEC)
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

  async function resend() {
    if (cooldown > 0) return
    // 同じ宛先・招待コードで再送
    setState('submitting')
    try {
      const res = await fetch('/api/v1/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sentTo,
          invite_code: inviteCode || undefined,
        }),
      })
      if (res.ok) {
        setState('sent')
        setCooldown(RESEND_COOLDOWN_SEC)
      } else {
        setState('sent') // 失敗しても送信済み画面は維持（連打させない）
        setCooldown(RESEND_COOLDOWN_SEC)
      }
    } catch {
      setState('sent')
      setCooldown(RESEND_COOLDOWN_SEC)
    }
  }

  // ===== 送信完了画面（C: 宛先表示 / B: クールダウン）=====
  if (state === 'sent') {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">📧</div>
        <div className="text-base font-semibold text-gray-900 mb-2">
          メールを確認してください
        </div>
        <div className="text-sm text-gray-600 leading-relaxed mb-1">
          <span className="font-medium text-gray-900 break-all">{sentTo}</span>
          <br />
          宛にログイン用リンクを送信しました。
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">
          メール内のリンクを開くとログインが完了します。
          <br />
          リンクは <strong>15 分間</strong> 有効です。
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">メールが届きませんか？</div>
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `再送信できます（あと ${cooldown} 秒）` : 'リンクを再送信する'}
          </button>
        </div>
      </div>
    )
  }

  // ===== 入力画面（A: メール経由であることを予告）=====
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 leading-relaxed">
        💡 入力したアドレスに<strong>ログイン用リンク</strong>をメールでお送りします。
        メール内のリンクを開くとログインできます。
        <br />
        （パスワードは不要です）
      </div>

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
        {state === 'submitting' ? '送信中...' : 'ログインリンクをメールで受け取る'}
      </button>
    </form>
  )
}
