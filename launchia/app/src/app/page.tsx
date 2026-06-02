import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * Launchia トップ `/`（launchia.net）— 開発者向け LP。
 *
 * デザイン: Stitch "Vibrant Dev-Pulse"（ネオブルータリズム）。コンテンツは Launchia の【実機能だけ】。
 * 二層構成（開発者向け↑ / 登録する人向け↓）。ライト/ダーク両対応（右下トグル＝`.dark` クラス）。
 * ダークは青ブランド維持（紫化しない）、ネオの枠+影は濃グレーインクで白すぎ回避。
 * 配色は本ページ内 CSS 変数に閉じており、globals.css の semantic トークンは汚さない。
 *
 * TODO: ヒーローのプレビュー画像は暫定の外部プレースホルダ。実スクショ or UI モックに差し替える。
 */
export const metadata: Metadata = {
  title: 'Launchia — リリース前から「欲しい人」を集めるウェイトリスト',
  description:
    '公開前から、あなたのプロダクトのファンクラブを。自社サイトに数行貼るだけでメール登録と順位表示が動き出す、リリース前アプリのためのウェイトリスト・サービス。',
}

const css = `
.slp {
  /* ライト */
  --slp-bg: #fbf8fe;
  --slp-surface: #f6f2f8;
  --slp-surface-high: #eae7ed;
  --slp-card: #fbf8fe;
  --slp-fg: #1b1b1f;
  --slp-fg-soft: #464555;
  --slp-fg-faint: #767587;
  --slp-ink: #1b1b1f;                       /* 枠線・ハード影・区切り線 */
  --slp-shadow-soft: rgba(27,27,31,0.12);
  --slp-overlay: rgba(63,64,231,0.10);
  --slp-primary: #3f40e7;
  --slp-on-primary: #ffffff;
  --slp-primary-strong: #5b5eff;
  --slp-on-primary-strong: #fefaff;
  --slp-orange: #fb7800;
  --slp-on-orange: #592600;
  --slp-green: #00845a;
  --slp-on-green: #eefff2;
  --slp-hero-box-text: #fefaff;
  --slp-chip-amber-bg: #ffdbc8;
  --slp-chip-amber-fg: #321200;
  --slp-chip-amber-dot: #994700;
  --slp-chip-indigo-bg: #e1e0ff;
  --slp-chip-indigo-fg: #06006c;
  --slp-chip-mint-bg: #74fbbe;
  --slp-chip-mint-fg: #002113;

  font-family: 'Geist', sans-serif;
  background-color: var(--slp-bg);
  color: var(--slp-fg);
}
.dark .slp {
  /* ダーク（青ブランド維持・方針 B）。インクは濃グレーで枠/影を可視化しつつ白すぎ回避 */
  --slp-bg: #131316;
  --slp-surface: #1f1f29;
  --slp-surface-high: #2a2a35;
  --slp-card: #1a1a22;
  --slp-fg: #ece9f0;
  --slp-fg-soft: #bdb9cc;
  --slp-fg-faint: #908ca0;
  --slp-ink: #3a3a48;
  --slp-shadow-soft: rgba(0,0,0,0.35);
  --slp-overlay: rgba(0,0,0,0.45);
  --slp-primary: #9aa0ff;
  --slp-on-primary: #0c0c1a;
  --slp-primary-strong: #6f6dff;
  --slp-on-primary-strong: #f3f0ff;
  --slp-orange: #ff9a3d;
  --slp-on-orange: #3a1c00;
  --slp-green: #34d99e;
  --slp-on-green: #06231a;
  --slp-hero-box-text: #1a0f00;
  --slp-chip-amber-bg: #5a3a1f;
  --slp-chip-amber-fg: #ffd9b8;
  --slp-chip-amber-dot: #ffb068;
  --slp-chip-indigo-bg: #2f2f63;
  --slp-chip-indigo-fg: #d9d8ff;
  --slp-chip-mint-bg: #114a36;
  --slp-chip-mint-fg: #8df3c5;
}
.slp-display { font-family: 'Lexend', sans-serif; font-weight: 700; font-size: 32px; line-height: 1.2; letter-spacing: -0.02em; }
@media (min-width: 768px) { .slp-display { font-size: 48px; line-height: 1.1; } }
.slp-headline { font-family: 'Lexend', sans-serif; font-weight: 600; font-size: 24px; line-height: 1.3; }
.slp-bodylg { font-family: 'Geist', sans-serif; font-weight: 400; font-size: 18px; line-height: 1.6; }
.slp-body { font-family: 'Geist', sans-serif; font-weight: 400; font-size: 16px; line-height: 1.5; }
.slp-btn { font-family: 'Lexend', sans-serif; font-weight: 600; font-size: 16px; line-height: 1; }
.slp-code { font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 14px; line-height: 1.4; }
.slp-eyebrow { font-family: 'Lexend', sans-serif; font-weight: 700; font-size: 20px; line-height: 1; }
.slp .neo-border { border: 4px solid var(--slp-ink); }
.slp .neo-border-thin { border: 2px solid var(--slp-ink); }
.slp .neo-btn { transition: all .15s ease; }
.slp .neo-btn:hover { transform: translate(-2px, -2px); }
.slp .neo-btn:active { transform: translate(0, 0); box-shadow: 0 0 0 0 var(--slp-ink) !important; }
/* カードは「押せるボタン」ではないので、押し込みではなく上にフワッと浮かせる（カーソルも矢印のまま） */
.slp .slp-card { transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s ease; cursor: default; }
.slp .slp-card:hover { transform: translateY(-8px); box-shadow: 10px 14px 0px 0px var(--slp-ink); }
.slp .slp-card-soft { transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s ease; cursor: default; }
.slp .slp-card-soft:hover { transform: translateY(-5px); box-shadow: 6px 9px 0px 0px var(--slp-shadow-soft); }
.slp .material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal; font-style: normal; line-height: 1;
  letter-spacing: normal; text-transform: none; display: inline-block;
  white-space: nowrap; word-wrap: normal; direction: ltr;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
`

export default function HomePage() {
  return (
    <div className="slp min-h-screen">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Lexend:wght@400;500;600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-[var(--slp-bg)] border-b-4 border-[color:var(--slp-ink)] shadow-[0_4px_0_0_var(--slp-ink)]">
        <nav className="flex justify-between items-center px-4 md:px-16 py-4 max-w-[1200px] mx-auto">
          <div className="slp-headline font-extrabold text-[color:var(--slp-primary)] tracking-tighter">Launchia</div>
          <Link
            href="/login"
            className="neo-btn bg-[var(--slp-primary)] text-[color:var(--slp-on-primary)] slp-btn px-6 py-3 neo-border rounded-xl shadow-[4px_4px_0px_0px_var(--slp-ink)] hover:shadow-[6px_6px_0px_0px_var(--slp-ink)]"
          >
            ログイン
          </Link>
        </nav>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 space-y-24 py-16">
        {/* Hero */}
        <section className="text-center space-y-8 py-12">
          <div className="inline-flex items-center gap-2.5 bg-[var(--slp-chip-amber-bg)] text-[color:var(--slp-chip-amber-fg)] px-12 py-3 rounded-full neo-border-thin slp-eyebrow shadow-[3px_3px_0px_0px_var(--slp-ink)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--slp-chip-amber-dot)] animate-pulse"></span>
            招待制でクローズドに始動中
          </div>
          <h1 className="slp-display max-w-4xl mx-auto leading-tight">
            公開はまだ。でも、
            <br />
            <span className="inline-block bg-[var(--slp-orange)] text-[color:var(--slp-hero-box-text)] px-4 py-2 my-2 rounded-xl neo-border-thin shadow-[4px_4px_0_0_var(--slp-ink)]">
              ファンクラブ
            </span>
            <br />
            はある。
          </h1>
          <p className="slp-bodylg text-[color:var(--slp-fg-soft)] max-w-2xl mx-auto">
            Launchia は、リリース前のプロダクトのためのウェイトリスト。自社サイトに数行貼るだけで、
            メール登録と順位表示が動き出します。
          </p>
          <div className="flex flex-col items-center gap-3 pt-4">
            <Link
              href="/login"
              className="neo-btn bg-[var(--slp-primary)] text-[color:var(--slp-on-primary)] slp-btn px-10 py-5 neo-border rounded-xl shadow-[8px_8px_0px_0px_var(--slp-ink)] hover:shadow-[10px_10px_0px_0px_var(--slp-ink)] flex items-center gap-2 group"
            >
              <span>ログインして始める</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                rocket_launch
              </span>
            </Link>
            <p className="slp-code text-[color:var(--slp-fg-faint)]">招待コードをお持ちの方（現在は招待制）</p>
          </div>
        </section>

        {/* Product preview placeholder（TODO: 実スクショ/UIモックに差し替え） */}
        <section className="relative w-full aspect-[16/7] neo-border rounded-2xl shadow-[12px_12px_0px_0px_var(--slp-primary-strong)] overflow-hidden bg-[var(--slp-surface-high)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Launchia ダッシュボードのイメージ"
            className="w-full h-full object-cover grayscale opacity-50 contrast-125"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEW7qW9lqtgUxO9_mi8Smz9pbQ79yYReYaeaJMAWqXo0kaIKwS4X1w1JG5Zh2iez22gUar-aPXFHvKYs75o8tlukgRAKL1YjvciHEN_-NzenLl1PfmxfQXr6kVcYnCTvShhwxCmlp0GRKRNobYGEzdSq8JZPMpsJqniHVfbBNAX5rTj22aHKq5FQUQjmGbPzDGcFItRcgtNx_R5PMDADHbTMMPyjf0XsopRXo1Nw-J7FDla7GQqWrE1T1AHOtyf-i9TyGhgc3yFl8"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--slp-overlay)] backdrop-blur-[2px]">
            <div className="bg-[var(--slp-card)] neo-border p-6 rounded-xl shadow-[8px_8px_0px_0px_var(--slp-ink)]">
              <span className="slp-code text-[color:var(--slp-primary)] font-bold">PREVIEW_V0.4.2</span>
            </div>
          </div>
        </section>

        {/* 3 Steps */}
        <section className="space-y-12">
          <div className="flex flex-col items-center gap-4">
            <span className="inline-flex items-center gap-2.5 bg-[var(--slp-chip-indigo-bg)] text-[color:var(--slp-chip-indigo-fg)] px-12 py-3 rounded-full neo-border-thin slp-eyebrow shadow-[3px_3px_0px_0px_var(--slp-ink)]">
              <span className="material-symbols-outlined text-2xl">terminal</span>
              開発者の方へ
            </span>
            <h2 className="slp-display text-center">
              使い方は{' '}
              <span className="underline decoration-[color:var(--slp-orange)] decoration-4 underline-offset-4">3 ステップ</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Step
              no="1"
              icon="edit_note"
              accentBg="var(--slp-primary)"
              accentText="var(--slp-on-primary)"
              iconColor="var(--slp-primary)"
              title="プロジェクトを作成"
              body="アプリ名と説明を登録するだけ。すぐにウェイトリストが開きます。"
            />
            <Step
              no="2"
              icon="integration_instructions"
              accentBg="var(--slp-orange)"
              accentText="var(--slp-on-orange)"
              iconColor="var(--slp-orange)"
              title="サイトに設置 / 公開"
              body="ウィジェットを数行貼るか、ホスト型のアイデアページを共有します。"
            />
            <Step
              no="3"
              icon="leaderboard"
              accentBg="var(--slp-green)"
              accentText="var(--slp-on-green)"
              iconColor="var(--slp-green)"
              title="登録と順位が集まる"
              body="メールはダブルオプトインで確認。登録者と順位をダッシュボードで管理できます。"
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="space-y-12">
          <h2 className="slp-display text-center">
            ファンが増える、
            <span className="underline decoration-[color:var(--slp-orange)] decoration-4 underline-offset-4">うれしい理由</span>
            。
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Benefit
              emoji="📈"
              accent="var(--slp-primary)"
              title="作る前に需要を検証"
              body="「欲しい人」の数と集まる速さで、リリース前から手応えを掴めます。"
            />
            <Benefit
              emoji="🧩"
              accent="var(--slp-orange)"
              title="ノーコードで埋め込み"
              body="Web Component を数行貼るだけ。既存の LP やどんなサイトにも置けます。"
            />
            <Benefit
              emoji="✅"
              accent="var(--slp-green)"
              title="ちゃんと届くメール"
              body="SPF / DKIM / DMARC 対応・ダブルオプトインで、確認済みの本物だけが残ります。"
            />
            <Benefit
              emoji="🏅"
              accent="var(--slp-primary-strong)"
              title="順位で熱量を維持"
              body="登録者は自分の順位を確認できます。早く登録するワクワクが、待ち時間を楽しみに変えます。"
            />
          </div>
        </section>

        {/* ── オーディエンスの切れ目（開発者 → 登録する人）── */}
        <div className="flex items-center gap-4" aria-hidden="true">
          <span className="h-1 flex-1 bg-[var(--slp-ink)] rounded-full"></span>
          <span className="material-symbols-outlined text-3xl text-[color:var(--slp-orange)]">arrow_downward</span>
          <span className="h-1 flex-1 bg-[var(--slp-ink)] rounded-full"></span>
        </div>

        {/* 下段：登録する人へ（エンドユーザー向け） */}
        <section className="space-y-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-2.5 bg-[var(--slp-chip-mint-bg)] text-[color:var(--slp-chip-mint-fg)] px-12 py-3 rounded-full neo-border-thin slp-eyebrow shadow-[3px_3px_0px_0px_var(--slp-ink)]">
              <span className="material-symbols-outlined text-2xl">groups</span>
              登録する人へ
            </span>
            <h2 className="slp-display">
              待つ時間も、
              <span className="underline decoration-[color:var(--slp-orange)] decoration-4 underline-offset-4">たのしい</span>
              。
            </h2>
            <p className="slp-bodylg text-[color:var(--slp-fg-soft)] max-w-2xl mx-auto">
              ウェイトリストに登録した人にも、ちゃんと価値があります。ただ待たせるだけにはしません。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Perk
              icon="trophy"
              iconColor="var(--slp-green)"
              title="いつでも順位を確認"
              body="登録時に届くリンクから、自分が今 何番目かをいつでもチェックできます。"
            />
            <Perk
              icon="mark_email_read"
              iconColor="var(--slp-primary)"
              title="登録はワンクリック確認"
              body="確認メールのリンクを1回押すだけ。ダブルオプトインだから安心、面倒な入力もありません。"
            />
            <Perk
              icon="notifications_active"
              iconColor="var(--slp-orange)"
              title="リリースしたらお知らせ"
              body="公開のタイミングで、登録したメールに通知が届きます。楽しみを見逃しません。"
            />
          </div>
        </section>

        {/* ── 区切り（締めは開発者へのCTA）── */}
        <div className="flex items-center gap-4" aria-hidden="true">
          <span className="h-1 flex-1 bg-[var(--slp-ink)] rounded-full"></span>
          <span className="material-symbols-outlined text-3xl text-[color:var(--slp-primary)]">rocket_launch</span>
          <span className="h-1 flex-1 bg-[var(--slp-ink)] rounded-full"></span>
        </div>

        {/* Final CTA（開発者向け） */}
        <section className="py-12">
          <div className="bg-[var(--slp-primary-strong)] text-[color:var(--slp-on-primary-strong)] p-8 md:p-16 neo-border rounded-[2.5rem] shadow-[16px_16px_0_0_var(--slp-ink)] text-center space-y-8">
            <h2 className="slp-display">
              さあ、ウェイトリストを
              <br className="md:hidden" />
              始めよう。
            </h2>
            <p className="slp-bodylg max-w-xl mx-auto opacity-90">
              招待コードをお持ちなら、ログインしてすぐにプロジェクトを作成できます。
            </p>
            <div className="flex justify-center">
              <Link
                href="/login"
                className="neo-btn bg-[var(--slp-orange)] text-[color:var(--slp-on-orange)] slp-btn px-12 py-6 neo-border rounded-2xl shadow-[6px_6px_0px_0px_var(--slp-ink)] hover:shadow-[8px_8px_0px_0px_var(--slp-ink)] text-xl flex items-center gap-2 group"
              >
                <span>ログインして始める</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[var(--slp-surface)] border-t-4 border-[color:var(--slp-ink)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 px-4 md:px-16 py-6 max-w-[1200px] mx-auto">
          <div className="slp-headline font-black text-[color:var(--slp-fg)] tracking-tighter">Launchia</div>
          <Link
            href="/privacy"
            className="slp-body text-[color:var(--slp-fg-soft)] hover:text-[color:var(--slp-primary)] hover:underline decoration-[color:var(--slp-primary)] decoration-2 transition-all"
          >
            プライバシーポリシー
          </Link>
          <p className="slp-body text-[color:var(--slp-fg-soft)]">© Launchia</p>
        </div>
      </footer>
    </div>
  )
}

function Step({
  no,
  icon,
  accentBg,
  accentText,
  iconColor,
  title,
  body,
}: {
  no: string
  icon: string
  accentBg: string
  accentText: string
  iconColor: string
  title: string
  body: string
}) {
  return (
    <div className="slp-card group bg-[var(--slp-surface)] p-8 neo-border rounded-2xl shadow-[6px_6px_0px_0px_var(--slp-ink)] relative overflow-hidden">
      <div
        className="absolute top-4 right-4 neo-border-thin w-10 h-10 flex items-center justify-center slp-headline rounded-full shadow-[2px_2px_0_0_var(--slp-ink)] transition-transform duration-200 group-hover:rotate-12"
        style={{ background: accentBg, color: accentText }}
      >
        {no}
      </div>
      <div className="space-y-4">
        <span
          className="material-symbols-outlined text-4xl inline-block transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
        <h3 className="slp-headline">{title}</h3>
        <p className="slp-body text-[color:var(--slp-fg-soft)]">{body}</p>
      </div>
    </div>
  )
}

function Benefit({
  emoji,
  accent,
  title,
  body,
}: {
  emoji: string
  accent: string
  title: string
  body: string
}) {
  return (
    <div
      className="slp-card-soft group flex gap-6 p-6 bg-[var(--slp-card)] neo-border rounded-xl shadow-[4px_4px_0_0_var(--slp-shadow-soft)]"
      style={{ borderLeftWidth: 8, borderLeftColor: accent }}
    >
      <div className="text-4xl shrink-0 transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-6">
        {emoji}
      </div>
      <div className="space-y-2">
        <h4 className="slp-headline">{title}</h4>
        <p className="slp-body text-[color:var(--slp-fg-soft)]">{body}</p>
      </div>
    </div>
  )
}

function Perk({
  icon,
  iconColor,
  title,
  body,
}: {
  icon: string
  iconColor: string
  title: string
  body: string
}) {
  return (
    <div className="slp-card group bg-[var(--slp-surface)] p-8 neo-border rounded-2xl shadow-[6px_6px_0px_0px_var(--slp-ink)]">
      <div className="space-y-4">
        <span
          className="material-symbols-outlined text-4xl inline-block transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
        <h3 className="slp-headline">{title}</h3>
        <p className="slp-body text-[color:var(--slp-fg-soft)]">{body}</p>
      </div>
    </div>
  )
}
