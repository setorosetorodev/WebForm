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

/**
 * 開発者 neo（ネオブルータリズム）の共有 authored CSS の【単一ソース】。
 * タイポ＋ネオの枠/ハード影/ボタン/カード/入力をここに集約する。
 * - 色は globals.css の `--color-neo-*` トークンを参照する（ここに hex を置かない）。
 * - authored クラスを globals.css に置かない理由は docs/DESIGN.md（Turbopack dev のキャッシュ問題）。
 * - 読み込みは `<NeoStyle/>`（src/app/neo-style.tsx）が フォント＋この CSS をまとめて inject。
 * 寸法（枠 3px・影 4/5px 等）は neo の様式そのものなので、ここを唯一の定義箇所とする。
 */
export const NEO_CSS = BRAND_WORDMARK_CSS + `
/* --- タイポ --- */
.neo-display { font-family:'Lexend',sans-serif; font-weight:800; letter-spacing:-0.02em; line-height:1.15; }
.neo-headline { font-family:'Lexend',sans-serif; font-weight:700; line-height:1.3; }
.neo-eyebrow { font-family:'Lexend',sans-serif; font-weight:700; }
.neo-label { font-family:'Lexend',sans-serif; font-weight:600; }
.neo-bodylg { font-family:'Geist',sans-serif; font-weight:400; font-size:18px; line-height:1.6; }
.neo-body { font-family:'Geist',sans-serif; font-weight:400; line-height:1.5; }
.neo-code { font-family:'JetBrains Mono',monospace; font-weight:500; }
/* --- 枠（極太） --- */
.neo-border { border:3px solid var(--color-neo-ink); }
.neo-border-thin { border:2px solid var(--color-neo-ink); }
/* --- ボタン：ハード影＋押し込み（色は bg-neo-* / text-neo-* を併用） --- */
.neo-btn { font-family:'Lexend',sans-serif; font-weight:600; border:3px solid var(--color-neo-ink); box-shadow:4px 4px 0 0 var(--color-neo-ink); transition:transform .12s ease, box-shadow .12s ease; cursor:pointer; }
.neo-btn:hover:not(:disabled) { transform:translate(-2px,-2px); box-shadow:6px 6px 0 0 var(--color-neo-ink); }
.neo-btn:active:not(:disabled) { transform:translate(0,0); box-shadow:0 0 0 0 var(--color-neo-ink); }
.neo-btn:disabled { opacity:.5; cursor:not-allowed; box-shadow:4px 4px 0 0 var(--color-neo-ink); transform:none; }
/* --- カード：静的（枠＋ハード影）／リンク時は浮かせる --- */
.neo-card { border:3px solid var(--color-neo-ink); box-shadow:5px 5px 0 0 var(--color-neo-ink); }
.neo-card-link { transition:transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s ease; }
.neo-card-link:hover { transform:translateY(-4px); box-shadow:8px 10px 0 0 var(--color-neo-ink); }
/* --- 入力：太枠＋フォーカスでハード影 --- */
.neo-input { font-family:'Geist',sans-serif; width:100%; padding:0.625rem 0.875rem; border:2px solid var(--color-neo-ink); border-radius:0.75rem; background:var(--color-neo-card); color:var(--color-neo-fg); outline:none; transition:box-shadow .12s ease, border-color .12s ease; }
.neo-input:focus { border-color:var(--color-neo-primary); box-shadow:3px 3px 0 0 var(--color-neo-primary); }
.neo-input::placeholder { color:var(--color-neo-fg-faint); }
.neo-input:disabled { opacity:.5; }
`
