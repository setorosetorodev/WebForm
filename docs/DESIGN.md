# Launchia デザインガイド (DESIGN.md)

Launchia フロントエンド（`launchia/app/`）のデザインの**正の情報源**。
色・タイポ・余白・コンポーネントの規約をここに集約する。

> **大原則**: 画面ファイルに色のリテラル（`bg-blue-600` 等）を直接書かない。
> ブランド由来の色は **デザイントークン**（`brand-*`）を参照する。
> トークンの実体は `launchia/app/src/app/globals.css` の `@theme` ブロックにある。
> このファイル（ルール）と globals.css（実装）が一致している状態を保つこと。

作成: 2026-06-01 ／ 対象: `launchia/app`（Next.js App Router + Tailwind CSS v4）

---

## 1. デザイントークンとは

「色・余白・角丸・フォント」などに**名前を付けて一箇所で定義**し、各画面はその名前を
参照する仕組み。値を変えるときは定義の一箇所だけ直せば全画面に反映される。
（LLM の「トークン」とは無関係。実行時コストもゼロ＝ただの CSS 変数。）

実体は `globals.css` の `@theme { ... }`。Tailwind v4 はここに書いた `--color-brand-600`
から自動で `bg-brand-600` / `text-brand-600` / `border-brand-600` 等のユーティリティを生成する。

---

## 2. カラー

### 2.1 ブランド / アクセント（トークン化済み・`brand-*`）

サービスの基調色。CTA ボタン・リンク・順位の強調数値・フォーカスリングなどに使う。
**変更はここを差し替えるだけ**（`globals.css` の `@theme`）。現状は Tailwind 標準 "blue" と同値。

| トークン | 用途の例 |
| :-- | :-- |
| `brand-50` | 淡い背景（CTA カード、ヒント枠、順位表示の枠） |
| `brand-100` | フォーカスリング (`focus:ring-brand-100`)、淡い枠線、badge 背景 |
| `brand-300` | hover 時の枠線 (`hover:border-brand-300`) |
| `brand-500` | フォーカス時の入力枠線 (`focus:border-brand-500`) |
| `brand-600` | **主アクション**（ボタン背景・リンク文字・強調数値） |
| `brand-700` | hover 時の主アクション、badge 文字 |
| `brand-900` | ヒント枠内の濃い文字 |

使用例（このパターンに揃える）:
- 主ボタン: `bg-brand-600 hover:bg-brand-700 text-white`
- リンク: `text-brand-600 hover:text-brand-700` または `hover:underline`
- チェックボックス: `accent-brand-600`
- 入力フォーカス: `focus:border-brand-500 focus:ring-2 focus:ring-brand-100`

### 2.2 中立色・意味色（Tailwind 標準パレットを使用）

ブランド以外は Tailwind の標準色をそのまま「役割」として使う（現状トークン化しない）。
役割と色の対応を固定し、これ以外の色相を増やさない。

| 役割 | 使う色 | 主な用途 |
| :-- | :-- | :-- |
| 中立 (neutral) | `gray-*` | 文字・枠線・背景。下記の文字色ルール参照 |
| 成功 (success) | `green-*` | 「確認済み」badge、保存完了、登録完了 |
| 注意 (warning) | `amber-*` | 「確認待ち」badge、設定未完の警告 |
| 危険 (danger) | `red-*` | エラー文言、削除・解除ボタン、必須印 `*` |

文字色の階層（`gray`）:
- `text-gray-900` … 見出し・本文の主役
- `text-gray-700` … ラベル・やや強い本文
- `text-gray-500` / `text-gray-600` … 補足・説明
- `text-gray-400` … フッタ・極めて控えめな注記

面・枠:
- 背景: `bg-gray-50`（ページ地）／ `bg-white`（カード地）
- 枠線: `border-gray-200`（カード）／ `border-gray-300`（入力）／ `border-gray-100`（区切り線）

> 将来、success/warning/danger も `--color-success-*` 等のトークンに昇格してよい。
> その場合はこの表とコードを同時に更新する。

---

## 3. タイポグラフィ

- **フォント**: 現状はシステムフォント（`--font-sans`、OS 標準 UI フォント）。
  Web フォント（Geist 等）は **STITCH でデザイン確定後に** `globals.css` の `--font-sans` を
  差し替えて導入する。`next/font` を使う場合は `app/AGENTS.md` の指示どおり
  `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` を読んでから。
- `font-mono` … slug・コード・埋め込みスニペット等の等幅表示（Tailwind 標準の mono スタック）。
- サイズの目安: 見出し `text-2xl〜4xl font-bold`、本文 `text-sm`、注記 `text-xs`。
  順位などの強調数値は `text-4xl〜6xl font-extrabold text-brand-600`。

---

## 4. 形・余白・影

- **角丸**: 入力/ボタン = `rounded-lg`、カード = `rounded-xl`、モーダル風カード/画像 = `rounded-2xl`。
- **影**: 基本は影なし（枠線で区切る）。認証・公開系の中央カードのみ `shadow-lg`、hover 強調に `shadow-sm`。
- **ページ幅**（中央寄せ `mx-auto px-4 py-8`）:
  - `max-w-md` … 単機能の中央カード（ログイン・順位確認・not-found）
  - `max-w-2xl` … フォーム1枚（新規プロジェクト）
  - `max-w-3xl` … 詳細・公開アイデアページ
  - `max-w-5xl` … 一覧・管理ヘッダー
- **間隔**: フォーム要素は `space-y-4`〜`space-y-5`、リストは `space-y-3`。

---

## 5. コンポーネント規約（現状の実装パターン）

新規 UI はこのパターンに合わせる（コピー元の参考実装をコメントに添える）。

| 要素 | クラス（雛形） |
| :-- | :-- |
| 主ボタン | `w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed` |
| 危険ボタン | `px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg` |
| 副ボタン | `px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50` |
| 入力/テキストエリア | `w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100` |
| カード | `bg-white rounded-xl p-5 border border-gray-200`（hover で `hover:border-brand-300 hover:shadow-sm transition-all`） |
| badge（成功/注意/ブランド） | `text-xs px-2 py-0.5 rounded` + `bg-green-50 text-green-700` / `bg-amber-50 text-amber-700` / `bg-brand-50 text-brand-700` |
| エラー枠 | `text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200` |

---

## 6. ダークモード

**現状は未対応（ライト固定）**。各ページが `bg-gray-50` / `bg-white` 等を直接指定しているため、
`prefers-color-scheme` には反応しない。対応する場合は (a) 中立色も
セマンティックトークン化（`surface` / `text` 等）し、(b) `@theme` に dark 値を定義して、
ユーティリティを意味ベースに置き換える設計変更が要る。Stitch でのデザイン確定後に判断する。

---

## 7. 適用範囲とウィジェット

- このガイドの対象は **`launchia/app`**（管理画面・`/p` アイデアページ・`/r` 順位ページ）。
- **`launchia/widget`** は Shadow DOM 内に独自スタイルを持つ別実装。Tailwind の `@theme` は届かない。
  ウィジェットの配色を Launchia ブランドに合わせる場合は、widget 側に同じ `brand` 値を別途反映する
  （将来はトークンを共有する仕組みを検討）。

---

## 8. リブランド / デザイン刷新の手順（STITCH 連携）

1. STITCH 等でデザイン案を作成し、配色・フォント・角丸の方針を決める。
2. `globals.css` の `@theme` の `--color-brand-*`（と必要なら `--font-sans`）を差し替える。
   → 各ページは `brand-*` を参照しているので、**1ファイルの変更で全画面に反映**される。
3. 必要なら本ファイルの表（用途・値）を更新し、ルールと実装を一致させる。
4. 中立色やコンポーネント構造まで変える場合は、§2.2 のトークン昇格や共通コンポーネント抽出を検討。

---

*作成者: Claude Code + 瀬戸口耕司*
