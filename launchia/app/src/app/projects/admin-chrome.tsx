import Link from 'next/link'
import type { ReactNode } from 'react'
import { BRAND_WORDMARK_CSS } from '../brand'

/**
 * 管理画面の共通 chrome（ヘッダ＋フッタ）。トップ LP(page.tsx) のヘッダ/フッタと【同一の見た目】。
 * 唯一の違いは右側だけ: LP は「ログイン」ボタン、ここはメール＋ログアウト（＝文脈上の必然）。
 * ライト/ダーク対応。配色・寸法は LP(.slp) と同じ値に揃えてある（.lhx スコープに閉じる）。
 */
const css = BRAND_WORDMARK_CSS + `
.lhx {
  --lh-bg: #fbf8fe; --lh-surface: #f6f2f8; --lh-fg: #1b1b1f; --lh-fg-soft: #464555;
  --lh-fg-faint: #767587; --lh-ink: #1b1b1f; --lh-primary: #3f40e7; --lh-on-primary: #ffffff;
  --lh-orange: #fb7800;
  font-family: 'Geist', sans-serif; background-color: var(--lh-bg); color: var(--lh-fg);
}
.dark .lhx {
  --lh-bg: #131316; --lh-surface: #1f1f29; --lh-fg: #ece9f0; --lh-fg-soft: #bdb9cc;
  --lh-fg-faint: #908ca0; --lh-ink: #3a3a48; --lh-primary: #9aa0ff; --lh-on-primary: #0c0c1a;
  --lh-orange: #ff9a3d;
}
/* ロゴは globals.css の .brand-wordmark / .brand-wordmark-strong（単一定義）を使う。
   LP の slp-body と同一（フッタ文字サイズを揃える） */
.lhx-body { font-family: 'Geist', sans-serif; font-weight: 400; font-size: 16px; line-height: 1.5; }
/* LP のヘッダ「ログイン」ボタンと同一寸法のネオボタン（ヘッダ高さを揃えるため） */
.lhx-btn { font-family: 'Lexend', sans-serif; font-weight: 600; font-size: 16px; line-height: 1; }
.lhx .neo-btn { transition: all .15s ease; }
.lhx .neo-btn:hover { transform: translate(-2px, -2px); }
.lhx .neo-btn:active { transform: translate(0, 0); box-shadow: 0 0 0 0 var(--lh-ink) !important; }
.lhx .neo-border { border: 4px solid var(--lh-ink); }
`

export function AdminChrome({
  email,
  actions,
  children,
}: {
  email?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="lhx min-h-screen flex flex-col">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Lexend:wght@600;700;800;900&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Header — LP と同一（右側だけメール＋ログアウト） */}
      <header className="sticky top-0 z-40 bg-[var(--lh-bg)] border-b-4 border-[color:var(--lh-ink)] shadow-[0_4px_0_0_var(--lh-ink)]">
        <nav className="flex justify-between items-center px-4 md:px-16 py-4 max-w-[1200px] mx-auto">
          <Link href="/projects" className="brand-wordmark text-[color:var(--lh-primary)]">
            Launchia<span className="text-[color:var(--lh-orange)]">.</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {email && (
              <span className="text-[color:var(--lh-fg-faint)] hidden sm:inline font-mono text-xs">
                {email}
              </span>
            )}
            {actions}
          </div>
        </nav>
      </header>

      {/* Content */}
      <div className="flex-grow">{children}</div>

      {/* Footer — LP と同一 */}
      <footer className="bg-[var(--lh-surface)] border-t-4 border-[color:var(--lh-ink)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 px-4 md:px-16 py-6 max-w-[1200px] mx-auto">
          <span className="brand-wordmark-strong text-[color:var(--lh-fg)]">
            Launchia<span className="text-[color:var(--lh-orange)]">.</span>
          </span>
          <Link
            href="/privacy"
            className="lhx-body text-[color:var(--lh-fg-soft)] hover:text-[color:var(--lh-primary)] hover:underline"
          >
            プライバシーポリシー
          </Link>
          <span className="lhx-body text-[color:var(--lh-fg-faint)]">© Launchia</span>
        </div>
      </footer>
    </div>
  )
}
