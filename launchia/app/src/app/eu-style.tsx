import { EU_CSS } from './brand'

/**
 * エンドユーザー（登録者）neo 系ページの【単一インクルード】。フォント（Lexend/Geist/JetBrains Mono）と
 * 共有 authored CSS（EU_CSS = Mango Pop）をまとめて読み込む。
 * - 対象: /p（アイデアページ）・/r（順位ページ）。
 * - 色トークン（--color-eu-*）は globals.css 側にあるのでここでは読み込まない。
 */
export function EuStyle() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Lexend:wght@500;600;700;800&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: EU_CSS }} />
    </>
  )
}
