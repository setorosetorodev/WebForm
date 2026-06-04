# Launchia デザインガイド (DESIGN.md)

Launchia フロントエンド（`launchia/app/`）のデザインの**正の情報源**。
色・タイポ・余白・コンポーネントの規約と、**ライト/ダークモード**の仕組みをここに集約する。

> **大原則**: 画面ファイルに色のリテラル（`bg-white` / `text-gray-900` / `bg-blue-600` 等）を
> 直接書かない。**意味トークン**（`bg-card` / `text-fg` / `bg-primary` 等）を参照する。
> トークンの実体は `launchia/app/src/app/globals.css` の `@theme`（ライト）と `.dark`（ダーク）。
> このファイル（ルール）と globals.css（実装）が一致している状態を保つこと。

最終更新: 2026-06-03 ／ 対象: `launchia/app`（Next.js App Router + Tailwind CSS v4）

---

## 設計統治（最上位ルール・2026-06-03 確定）

Launchia は **2つのデザインシステム**を持つ。各ページはどちらか一方に属し、その系の単一ソースに従う。

| 系 | 対象ページ | デザイン | 単一ソース |
| :-- | :-- | :-- | :-- |
| **開発者向け** | `/`(LP), `/login`, `/projects/*`(ダッシュボード・管理), 管理 chrome | **neo / Vibrant Dev-Pulse**（ネオブルータリズム：極太枠＋ハード影／Lexend・Geist・JetBrains Mono／青×オレンジ×緑） | この DESIGN.md ＋ `globals.css` の開発者トークン ＋ `src/app/brand.ts` |
| **エンドユーザー向け** | `/p/[slug]`(アイデア/登録), `/r/[token]`(順位), 埋め込みウィジェット | **neo 構造＋暖色 = Mango Pop**（鮮烈オレンジ `#ff7a00` × ホットピンク `#ff2e63` × イエロー。warm/light 固定＝ダーク反転なし。5案 `/preview/enduser-palettes` から **2026-06-04 選定・適用済み**） | `globals.css` の `--color-eu-*` ＋ `src/app/brand.ts` の `EU_CSS` ＋ `src/app/eu-style.tsx` の `<EuStyle/>`（widget は Shadow DOM 内に同値の `--eu-*` を内蔵） |

`/privacy` 等の法務ページは中立。当面は開発者系に合わせる。

### 原則（ユーザー決定・2026-06-03）
1. **開発者向けページは全て neo(LP) に統一**。未作成ページも踏襲する。
2. **エンドユーザー向けは専用デザイン**。`DESIGN-ENDUSER.md` を正とし、全エンドユーザーページへ適用する。
3. **各系は単一ソース**：色＝`globals.css` のトークン、共有体裁（ワードマーク等）＝`brand.ts`/共有コンポーネント。**ページに色や寸法の hex/数値を直書きしない**。
4. **微調整のためのハードコードをしない**。ズレたら共有定義（トークン/定数/コンポーネント）を直す。一点ハック禁止。
5. **原則で不都合が出たら、この DESIGN.md にルールを追記して解決**する（運用で学んだ制約はここに蓄積し、次回以降に効かせる）。

### 運用で確定した実装ルール（§原則5 の蓄積）
- **色トークンは `globals.css` の `@theme`/`.dark`（または系別スコープクラス）に置く**＝Tailwind が確実に出力する。開発者 neo は `--color-neo-*`（→ `bg-neo-*`/`text-neo-*`/`border-neo-*` を自動生成）。
- **authored CSS クラス（タイポ・共有体裁）は `globals.css` に置かない**。Turbopack dev が globals.css の authored クラスを serve しないキャッシュ問題があったため、**共有 CSS は `src/app/brand.ts` の定数に集約**し、各ページの `<style>` がそれを読む（`NEO_CSS`＝`.neo-display`/`.neo-card`/`.neo-btn`/`.neo-input` 等／`brand-wordmark`）。読込は `<NeoStyle/>`。
- **1つの値を2か所以上に手書きしない**（ドリフトの温床。実際に LP/管理でロゴの太さ・ヘッダ高さがズレた）。
- **削除は基本 論理削除**（`deleted_at`）。物理削除しない（過去データは調査・遡及に残す）。例: `invite_codes`・`waitlist_entries`。一覧では「削除済み/期限切れ」を表示し続け、有効判定からのみ除外。
- **メール（`api/`）は token 対象外**（Webフォント/CSS変数/影が効かない）。ただし**開発者向けメール**（ログインリンク・招待通知・コード送付・却下）は neo ブランド（藍×オレンジのワードマーク＋極太ボーダー）を inline hex で寄せる（`api/src/lib/email.ts` の `neoMail*` ヘルパ）。**エンドユーザー向けメール**（ウェイトリスト確認/完了/解除）も **Mango Pop（暖色 neo）に統一済み**（2026-06-04）＝`api/src/lib/email.ts` の `euMail*` ヘルパ（`EU_MAIL` パレット＝`--color-eu-*` と同値の inline hex／`euMailShell`／`euMailButton`）。

### 現状（移行中・2026-06-03 時点）
- **neo 単一ソースを新設済み**: 色＝`globals.css` の `--color-neo-*`（ライト=`@theme`／ダーク=`.dark`）、共有 authored クラス＝`src/app/brand.ts` の `NEO_CSS`（`src/app/neo-style.tsx` の `<NeoStyle/>` でフォントと一緒に読込）。
  → **login / projects(new・詳細・entries) / apply(公開申請) / 運営 invites がこれを参照**（hex 直書きなし）。
- **残債**: LP(`.slp`) / ダッシュボード(`.dash`) / chrome(`.lhx`) は今もローカルにハードコピー（値は `--color-neo-*` と一致）。将来エイリアス/移行で単一ソースに寄せる。
- **エンドユーザー系（`/p`・`/r`・widget）は Mango Pop に移行済み**（2026-06-04）: 色＝`globals.css` の `--color-eu-*`（warm/light 固定）、共有 authored クラス＝`brand.ts` の `EU_CSS`（`<EuStyle/>` で読込）。`registration-cta`・`unsubscribe-button` も適用。widget は Shadow DOM 内に同値を内蔵。
- 旧 M3ブルー系トークン（下記 §2）は **`privacy` 等の法務ページ**が使用（当面据え置き）。
- ※ 下記 §1〜§9 は M3ブルー時代の記述。neo 統一の進行に合わせて更新していく。

---

## 0. ファイルの役割（混同注意）

| ファイル | 種類 | 中身 |
| :-- | :-- | :-- |
| `docs/DESIGN.md`（これ） | 人間向けルール集（散文） | 規約・使い方・運用手順 |
| `docs/DESIGN-LIGHT.md` | テーマのトークン値（YAML） | Stitch エクスポート（M3, ライト配色）。値の出典 |
| `docs/DESIGN-DARK.md` | テーマのトークン値（YAML） | Stitch エクスポート（M3, ダーク配色）。値の出典 |
| `launchia/app/src/app/globals.css` | 実装 | 上記の値を意味トークンとして定義（`@theme` / `.dark`） |

`DESIGN-LIGHT/DARK.md` は Google **Stitch** が吐く Material Design 3 系の定義（`surface` / `on-surface` /
`primary` …）。約40のロールがあるが、アプリでは下記の**十数個の意味トークンに絞って**採用している。

---

## 1. デザイントークンとは

色・余白・フォント等に**名前を付けて一箇所で定義**し、各画面はその名前を参照する仕組み。
値を変えれば全画面に反映される（実行時コストゼロ＝ただの CSS 変数。LLM のトークンとは無関係）。
Tailwind v4 は `@theme` の `--color-card` から `bg-card` / `text-card` / `border-card` 等を自動生成する。

---

## 2. カラートークン（意味ベース）

`globals.css` で定義。ライト値は `@theme`、ダーク値は `.dark`。**配色変更はこの2箇所だけ**直す。

### 2.1 面・文字・罫線

| トークン（ユーティリティ例） | 役割 | ライト | ダーク |
| :-- | :-- | :-- | :-- |
| `bg` (`bg-bg`) | ページ地 | `#f7f9ff` | `#131313` |
| `card` (`bg-card`) | カード・ヘッダー | `#ffffff` | `#1c1b1b` |
| `muted` (`bg-muted`) | 入力欄・コード・入れ子の薄い面 | `#f1f4fa` | `#201f1f` |
| `fg` (`text-fg`) | 主役テキスト・見出し | `#181c20` | `#e5e2e1` |
| `fg-soft` (`text-fg-soft`) | 補足テキスト・ラベル | `#424753` | `#c2c6d2` |
| `fg-faint` (`text-fg-faint`) | 最も控えめな注記 | `#727785` | `#8c919c` |
| `line` (`border-line`) | カード枠・区切り線 | `#c2c6d5` | `#424751` |
| `line-strong` (`border-line-strong`) | 入力欄の枠 | `#727785` | `#8c919c` |

### 2.2 ブランド / 主アクション (primary)

| トークン | 役割 | ライト | ダーク |
| :-- | :-- | :-- | :-- |
| `primary` | ボタン地・リンク・強調数値 | `#0058bd` | `#a9c7ff` |
| `on-primary` | primary 上の文字 | `#ffffff` | `#003063` |
| `primary-hover` | primary の hover | `#004494` | `#7baaf7` |
| `primary-soft` | 淡い brand 背景（CTA枠・ヒント・badge・focus ring） | `#d8e2ff` | `#00468b` |
| `on-primary-soft` | primary-soft 上の文字 | `#004494` | `#d6e3ff` |

### 2.3 状態色 (success / warning / danger)

| トークン | 用途 | ライト | ダーク |
| :-- | :-- | :-- | :-- |
| `success` / `success-soft` | 「確認済み」badge・完了 | `#15803d` / `#dcfce7` | `#86efac` / `#0d2c18` |
| `warning` / `warning-soft` | 「確認待ち」badge・警告 | `#b45309` / `#fef3c7` | `#fcd34d` / `#2e2206` |
| `danger` / `danger-soft` | エラー文字・危険ボタン・必須印 | `#ba1a1a` / `#ffdad6` | `#ffb4ab` / `#5a0a0a` |
| `on-danger` | 危険ボタン上の文字 | `#ffffff` | `#690005` |

> 注: Stitch の `secondary` / `tertiary` はダークでグレー/別系統に再マップされており success の概念に
> 使えないため、success/warning は M3 ロールに依らず本ガイドで独自に light/dark を定義している。

---

## 3. ダークモード

**クラス連動**で切り替える（`prefers-color-scheme` 直結ではない）。

- `<html>` に `.dark` が付くとダーク。`globals.css` の `@custom-variant dark` でこの方式に設定。
- 切替トグル: `src/app/theme-toggle.tsx`（右下固定）。選択を `localStorage('theme')` に保存。
- 初期適用（ちらつき防止）: `src/app/layout.tsx` の `<head>` インラインスクリプトが
  ハイドレーション前に `.dark` を付与。`localStorage` 優先、未設定なら OS 設定に追従。
- 各ページが意味トークンを参照しているため、`.dark` の値上書きだけで全画面が自動で切り替わる。
  → **個別ページに `dark:` バリアントを書く必要は基本ない。**

---

## 4. タイポグラフィ

- **フォント**: 現状はシステムフォント（`--font-sans`）。Stitch 定義は **Inter** を指定しているが、
  Web フォント導入（`next/font`）は別タスク。導入時は `app/AGENTS.md` の指示どおり
  `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` を読んでから。
- `font-mono` … slug・コード・埋め込みスニペット（Tailwind 標準 mono）。
- サイズ目安: 見出し `text-2xl〜4xl font-bold`、本文 `text-sm`、注記 `text-xs`。
  順位の強調数値は `text-4xl〜6xl font-extrabold text-primary`。

---

## 5. 形・余白・幅

- **角丸**: 入力/ボタン `rounded-lg`、カード `rounded-xl`、モーダル風カード/画像 `rounded-2xl`。
- **影**: 基本は罫線（`border-line`）で区切る。中央カードのみ `shadow-lg`、hover 強調に `shadow-sm`。
- **ページ幅**（`mx-auto px-4 py-8`）: `max-w-md`（単機能カード）/ `max-w-2xl`（フォーム）/
  `max-w-3xl`（詳細・公開ページ）/ `max-w-5xl`（一覧・管理ヘッダー）。
- **間隔**: フォーム `space-y-4`〜`5`、リスト `space-y-3`。

---

## 6. コンポーネント規約（雛形）

| 要素 | クラス |
| :-- | :-- |
| 主ボタン | `w-full px-4 py-3 bg-primary hover:bg-primary-hover text-on-primary font-semibold rounded-lg disabled:opacity-50` |
| 危険ボタン | `px-4 py-2 bg-danger hover:opacity-90 text-on-danger rounded-lg` |
| 副ボタン | `px-4 py-2 border border-line-strong rounded-lg hover:bg-muted` |
| 入力 | `w-full px-4 py-2.5 rounded-lg border border-line-strong focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft` |
| カード | `bg-card rounded-xl p-5 border border-line`（hover: `hover:border-primary hover:shadow-sm transition-all`） |
| badge | `text-xs px-2 py-0.5 rounded` + `bg-success-soft text-success` / `bg-warning-soft text-warning` / `bg-primary-soft text-on-primary-soft` |
| エラー枠 | `text-sm text-danger bg-danger-soft rounded-lg p-3 border border-danger` |
| リンク | `text-primary hover:text-primary-hover`（または `hover:underline`） |

---

## 7. 旧 gray/blue → 意味トークン 対応表（移行の記録）

過去の raw ユーティリティは以下に置換済み（2026-06-01）。今後 raw 色は使わない。

| 旧 | 新 |
| :-- | :-- |
| `bg-gray-50`(ページ) / (入れ子) | `bg-bg` / `bg-muted` |
| `bg-white` | `bg-card` |
| `bg-gray-100` | `bg-muted` |
| `text-gray-900/800` | `text-fg` |
| `text-gray-700/600/500` | `text-fg-soft` |
| `text-gray-400` | `text-fg-faint` |
| `border-gray-300` | `border-line-strong` |
| `border-gray-200/100` | `border-line` |
| `bg-blue-600` / `hover:bg-blue-700` | `bg-primary` / `hover:bg-primary-hover` |
| `text-blue-600` | `text-primary` |
| `bg-blue-50` / `text-blue-900` | `bg-primary-soft` / `text-on-primary-soft` |
| `focus:border-blue-500` / `focus:ring-blue-100` | `focus:border-primary` / `focus:ring-primary-soft` |
| `accent-blue-600` | `accent-primary` |
| `green-*` / `amber-*` / `red-*` | `success(-soft)` / `warning(-soft)` / `danger(-soft)` |

---

## 8. ダークモード未対応・適用範囲

- **ウィジェット（`launchia/widget`）は対象外**。Shadow DOM 内に独自スタイルを持ち `@theme` が届かない。
  ブランド/ダーク対応する場合は widget 側に別途トークンを反映する（将来は共有を検討）。
- メール HTML（`api/`）も対象外。

---

## 9. リブランド / 再テーマの手順（STITCH 連携）

1. Stitch で**ライト＋ダークの両方**をエクスポートし、`docs/DESIGN-LIGHT.md` / `docs/DESIGN-DARK.md` を更新。
2. `globals.css` の `@theme`（ライト）と `.dark`（ダーク）の値を、上記2ファイルに合わせて差し替える。
   - 各ページは意味トークン参照なので、**この1ファイルの変更で全画面・ライト/ダーク両方に反映**される。
   - 何度も配色を試すなら、`DESIGN-*.md` の frontmatter(YAML) を読んで `globals.css` を**自動生成する
     スクリプト**を用意してもよい（現状は手作業で反映）。
3. トークンを増減した場合は本ファイル §2 の表とコードを同時に更新（ルールと実装の一致）。
4. フォント（Inter）を入れる場合は §4 を参照。

---

*作成者: Claude Code + 瀬戸口耕司*
