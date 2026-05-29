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
      <div className="bg-gray-50 rounded-xl py-6 px-4 text-center">
        <div className="text-sm font-medium text-gray-700 mb-1">登録を解除しました</div>
        <div className="text-xs text-gray-500">解除完了メールをお送りしました。</div>
      </div>
    )
  }

  if (state === 'confirming') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="text-sm font-medium text-gray-800 mb-2">本当に解除しますか？</div>
        <div className="text-xs text-gray-600 mb-4">
          解除すると順位情報は削除され、リリース時の通知も受け取れなくなります。
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setState('idle')}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={execute}
            className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            解除する
          </button>
        </div>
      </div>
    )
  }

  if (state === 'submitting') {
    return <div className="text-center text-sm text-gray-500 py-3">解除中...</div>
  }

  if (state === 'error') {
    return (
      <div className="text-center">
        <div className="text-sm text-red-600 mb-2">{errorMessage}</div>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="text-xs text-gray-500 underline"
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
      className="w-full text-sm text-gray-500 hover:text-red-600 underline py-2"
    >
      登録を解除する
    </button>
  )
}
