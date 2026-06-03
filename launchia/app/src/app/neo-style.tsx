import { NEO_CSS } from './brand'

/**
 * 開発者 neo 系ページの【単一インクルード】。フォント（Lexend/Geist/JetBrains Mono）と
 * 共有 authored CSS（NEO_CSS）をまとめて読み込む。
 * - AdminChrome 配下に無い独立ページ（/login, /apply）と projects/layout.tsx で読む。
 * - 色トークン（--color-neo-*）は globals.css 側にあるのでここでは読み込まない。
 */
export function NeoStyle() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Lexend:wght@500;600;700;800&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: NEO_CSS }} />
    </>
  )
}
