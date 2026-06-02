/**
 * ブランドのワードマーク「Launchia.」の【単一ソース】。
 * LP(page.tsx) と管理画面 chrome(admin-chrome.tsx) の両方の <style> がこの文字列を読む。
 * これにより太さ・サイズ・字間が必ず一致する（以前は各所で手書きしてドリフトした）。
 *
 * - 色は利用側がトークン（--slp-primary / --lh-primary 等）で指定する。
 * - Lexend は各ページで Google Fonts から読み込み済み。
 * - 値は LP の slp-headline(24px) + extrabold/black + tracking-tighter 相当。
 */
export const BRAND_WORDMARK_CSS = `
.brand-wordmark { font-family: 'Lexend', sans-serif; font-weight: 800; font-size: 24px; line-height: 1.3; letter-spacing: -0.05em; }
.brand-wordmark-strong { font-family: 'Lexend', sans-serif; font-weight: 900; font-size: 24px; line-height: 1.3; letter-spacing: -0.05em; }
`
