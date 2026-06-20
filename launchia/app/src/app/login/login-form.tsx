'use client'

import { useEffect, useState, type FormEvent } from 'react'

type Step = 'email' | 'code'
type State = 'idle' | 'submitting' | 'error'

const RESEND_COOLDOWN_SEC = 60

export function LoginForm() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [code, setCode] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // 再送信クールダウンのカウントダウン
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // ===== Step1: コード送信（メール入力）=====
  async function requestCode(e: FormEvent) {
    e.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          invite_code: inviteCode || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (res.ok) {
        setStep('code')
        setState('idle')
        setCode('')
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

  // ===== Step2: コード検証 =====
  async function verifyCode(e: FormEvent) {
    e.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        isAdmin?: boolean
        error?: string
      }

      if (res.ok && data.ok) {
        // セッション Cookie を確実に反映させるためフルナビゲーション
        window.location.assign(data.isAdmin ? '/projects/invites' : '/projects')
        return
      }
      if (res.status === 429 || data.error === 'too_many_attempts') {
        setErrorMessage('入力回数の上限に達しました。コードを再送してください。')
      } else {
        setErrorMessage('コードが正しくないか、有効期限が切れています。')
      }
      setState('error')
    } catch {
      setErrorMessage('通信エラーが発生しました。')
      setState('error')
    }
  }

  // 同じ宛先・招待コードでコードを再送（旧コードは失効し新コードのみ有効）
  async function resend() {
    if (cooldown > 0 || state === 'submitting') return
    setState('submitting')
    setErrorMessage('')
    try {
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          invite_code: inviteCode || undefined,
        }),
      })
      setState('idle')
      setCode('')
      setCooldown(RESEND_COOLDOWN_SEC)
      if (!res.ok) {
        // 失敗しても連打させない（クールダウンは張る）
        setErrorMessage('再送に失敗しました。少し待って再度お試しください。')
        setState('error')
      }
    } catch {
      setState('idle')
      setCooldown(RESEND_COOLDOWN_SEC)
    }
  }

  function backToEmail() {
    setStep('email')
    setState('idle')
    setErrorMessage('')
    setCode('')
    setCooldown(0)
  }

  // ===== Step2 画面（コード入力）=====
  if (step === 'code') {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🔢</div>
          <div className="neo-headline text-base text-neo-fg mb-2">
            ログインコードを入力
          </div>
          <div className="neo-body text-sm text-neo-fg-soft leading-relaxed">
            <span className="neo-code text-neo-fg break-all">{email}</span>
            <br />
            宛に <strong>6 桁のコード</strong> を送信しました。
            <br />
            このブラウザで入力してください（<strong>10 分間</strong>有効）。
          </div>
        </div>

        <div>
          <input
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            disabled={state === 'submitting'}
            autoFocus
            className="neo-input neo-code text-center text-2xl tracking-[0.4em]"
          />
        </div>

        {state === 'error' && (
          <div className="neo-body text-sm text-neo-danger text-center">{errorMessage}</div>
        )}

        <button
          type="submit"
          disabled={state === 'submitting' || code.length !== 6}
          className="neo-btn w-full bg-neo-primary text-neo-on-primary rounded-xl py-3"
        >
          {state === 'submitting' ? '確認中...' : 'ログイン'}
        </button>

        <div className="pt-4 border-t-2 border-neo-track text-center space-y-2">
          <div>
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0 || state === 'submitting'}
              className="neo-code text-sm text-neo-primary hover:underline disabled:text-neo-fg-faint disabled:no-underline disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `コードを再送できます（あと ${cooldown} 秒）` : 'コードを再送する'}
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={backToEmail}
              className="neo-body text-xs text-neo-fg-faint hover:text-neo-fg-soft hover:underline"
            >
              メールアドレスを変更する
            </button>
          </div>
        </div>
      </form>
    )
  }

  // ===== Step1 画面（メール入力）=====
  return (
    <form onSubmit={requestCode} className="space-y-4">
      <div className="bg-neo-primary-soft neo-border-thin rounded-xl p-3 neo-body text-xs text-neo-on-primary-soft leading-relaxed">
        💡 入力したアドレスに<strong>ログインコード</strong>をメールでお送りします。
        作業中のこのブラウザでコードを入力するとログインできます。
        <br />
        （パスワードは不要です）
      </div>

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1.5 block">
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
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1.5 block">
          招待コード <span className="text-neo-fg-faint font-normal">(新規ご利用のみ)</span>
        </label>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="LCHA-XXXX-XXXX"
          disabled={state === 'submitting'}
          className="neo-input neo-code text-sm"
        />
      </div>

      {state === 'error' && (
        <div className="neo-body text-sm text-neo-danger text-center">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="neo-btn w-full bg-neo-primary text-neo-on-primary rounded-xl py-3"
      >
        {state === 'submitting' ? '送信中...' : 'ログインコードをメールで受け取る'}
      </button>
    </form>
  )
}
