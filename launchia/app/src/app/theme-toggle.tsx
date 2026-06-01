'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/**
 * ライト/ダーク切替トグル（全ページ共通・右下固定）。
 * - 選択は localStorage('theme') に保存。未設定なら OS 設定に追従。
 * - 初期適用はちらつき防止のため layout.tsx のインラインスクリプトが先に行う。
 *   ここではマウント後に現在値を読み、トグル操作を担う。
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      // localStorage 不可（プライベートモード等）でも切替自体は動く
    }
  }

  // ハイドレーション不一致を避けるため、マウント前は描画しない
  if (!mounted) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-card border border-line text-fg-soft hover:text-fg hover:border-line-strong shadow-sm flex items-center justify-center transition-colors"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
