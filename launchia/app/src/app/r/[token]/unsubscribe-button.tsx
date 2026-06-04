'use client'

import { useState } from 'react'

type Props = {
  token: string
}

type State = 'idle' | 'confirming' | 'submitting' | 'done' | 'error'

export function UnsubscribeButton({ token }: Props) {
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function execute() {
    setState('submitting')
    try {
      const res = await fetch(
        `/api/v1/public/rank/${encodeURIComponent(token)}/unsubscribe`,
        { method: 'POST' },
      )
      if (res.ok) {
        setState('done')
      } else {
        setErrorMessage('解除に失敗しました。時間をおいて再度お試しください。')
        setState('error')
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="eu-neo-sm bg-eu-surface rounded-2xl py-6 px-4 text-center">
        <div className="eu-head text-sm text-eu-fg mb-1">登録を解除しました</div>
        <div className="eu-body text-xs text-eu-fg-soft">解除完了メールをお送りしました。</div>
      </div>
    )
  }

  if (state === 'confirming') {
    return (
      <div className="eu-neo-sm bg-eu-chip-bg rounded-2xl p-4">
        <div className="eu-head text-sm text-eu-fg mb-2">本当に解除しますか？</div>
        <div className="eu-body text-xs text-eu-fg-soft mb-4">
          解除すると順位情報は削除され、リリース時の通知も受け取れなくなります。
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setState('idle')}
            className="eu-btn bg-eu-card text-eu-fg flex-1 rounded-xl py-2 text-sm"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={execute}
            className="eu-btn bg-eu-accent text-eu-on-primary flex-1 rounded-xl py-2 text-sm"
          >
            解除する
          </button>
        </div>
      </div>
    )
  }

  if (state === 'submitting') {
    return <div className="eu-body text-center text-sm text-eu-fg-soft py-3">解除中...</div>
  }

  if (state === 'error') {
    return (
      <div className="text-center">
        <div className="eu-body text-sm text-eu-accent mb-2">{errorMessage}</div>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="eu-code text-xs text-eu-fg-soft underline"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setState('confirming')}
      className="eu-body w-full text-sm text-eu-fg-faint hover:text-eu-accent underline py-2"
    >
      登録を解除する
    </button>
  )
}
