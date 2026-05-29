# Launchia Phase 1 MVP 要件定義書（v1.0 ドラフト）

> 既存 PRD（`20260527_launchia_Project.md`）の **Phase 1: MVP / 自社ツール化** に相当する詳細要件。
> 戦略文書 `20260527_launchia_future_proposal.md`、`20260527_launchia_strategy_and_domain_plan.md`、`20260527_dasune_launchia_synergy.md` を踏まえて確定した内容を本書に反映する。

---

## 1. プロジェクト概要

### 1.1 目的
Launchia は、ローンチ前のアプリ／サービスに特化した「次世代ウェイトリスト・マーケットプレイス」。Phase 1 MVP では、自社プロジェクト「だすね」のウェイトリスト運用に必要な機能を **マルチテナント設計の下で** 確立し、同じ仕組みを他開発者にも提供できる素地を作る。

### 1.2 Phase 1 のゴール（成功基準）
1. 「だすね」LP に `<launchia-widget>` を埋め込み、ウェイトリスト登録〜順位確認のフルフローが本番動作している。
2. 同一 Launchia 環境で **第 2 のテスト・プロジェクト** が立ち上げられる（マルチテナント検証）。
3. 「LP がまだない開発者」も `launchia.net/p/<slug>` のアイデアページ単体でメアド収集できる。
4. 招待制で運営が許可した開発者は、サインアップ → プロジェクト作成 → 埋め込みコード取得まで管理画面で完結できる。

### 1.3 スコープ（含めるもの）
- マルチテナント設計（`project_id` 分離、Phase 1 期間は数件運用を想定）
- 開発者向け簡易管理画面（プロジェクト作成・編集、登録者リスト閲覧）
- エンドユーザー向け埋め込みウィジェット `<launchia-widget>`
- エンドユーザー向けホスト型「アイデアページ」`launchia.net/p/<slug>`
- 順位再訪確認 URL（マジックリンク方式）
- 登録解除（GDPR 対応）
- Resend を介したメール送信
- 招待制サインアップ（招待コード）
- 順位確認の閲覧ログ蓄積（可視化は Phase 2）

### 1.4 スコープ外（Phase 1.5 以降に送る）
- 招待リンクによる順位繰り上げ（バイラル・エンジン）→ **Phase 1.5**
- マイルストーン報酬（5 人招待で…）→ **Phase 2**
- FOMO ソーシャルプルーフ表示（「現在 1,234 人待機中」）→ **Phase 2**
- 熱量スコアの可視化・分析画面 → **Phase 2**
- 開発者ダッシュボード本体（高度な分析、複数管理者）→ **Phase 2**
- マーケットプレイス一覧 `/explore` → **Phase 3**
- 検索・カテゴリ・タグ → **Phase 3**
- Discord / Slack / X 連携 → **Phase 2 以降**
- Wallet / NFT 接続 → **将来検討**
- 開発者へのリアルタイム通知（メール / Webhook） → **Phase 2**
- 開発者カスタムドメインからの送信 → **Phase 2**（Pro プラン機能想定）
- 公開モード／アイデアモードの CTA 文言カスタマイズ → **Phase 2**

---

## 2. ステークホルダー

| 役割 | 説明 |
| :--- | :--- |
| 運営者 | Launchia 自体の管理者。招待コード発行、不正対応、モデレーション |
| 開発者ユーザー（B2B） | Launchia 上でプロジェクトを作成し、自社 LP に埋め込むか、`/p/<slug>` でアイデアを公開する |
| エンドユーザー（B2C） | 興味のあるプロジェクトにメアドで登録し、リリースを待つ |

---

## 3. 機能要件

### 3.1 開発者向け機能

#### 3.1.1 サインアップ（招待制）
- 招待コード `LCHA-XXXX-XXXX` を入力してメアド登録 → Magic Link メール送信 → クリックでログイン完了 & アカウント作成
- 招待コードは `max_uses` に達するか `expires_at` を超えると無効
- 運営者は管理 API / SQL で招待コードを発行する（運営用 UI は Phase 2）

#### 3.1.2 ログイン（Magic Link）
- 開発者はメアドを入力 → 15 分有効の Magic Link を受信 → クリックでセッション確立
- セッションは HttpOnly + Secure + SameSite=Lax の Cookie で管理（30 日有効、スライディング期限）
- パスワード機能なし（実装しない）

#### 3.1.3 プロジェクト作成・編集
- 必須項目: プロジェクト名、slug（`/p/<slug>` の URL に使用、英小文字・数字・ハイフン）
- 任意項目: 説明文（プレーンテキスト、改行可、最大 2,000 文字）、カバー画像 URL、LP URL（`landing_page_url`）
- 公開フラグ: `embed_enabled`（デフォルト true）、`idea_page_public`（デフォルト false）
- 同意要件: `require_consent`（デフォルト false）
- 許可ドメイン: `allowed_origins`（CSV / 配列、空配列は「すべて許可」のテストモード）

#### 3.1.4 埋め込みコード／アイデアページ URL のコピー
- プロジェクト詳細画面で次の 2 つをワンクリックコピー
  - 埋め込み HTML スニペット（`<script src="...">` ＋ `<launchia-widget project-slug="..."></launchia-widget>`）
  - アイデアページ URL（`idea_page_public=true` の時のみ表示）

#### 3.1.5 登録者リスト閲覧
- プロジェクトごとに、登録者のメアド・登録日時・順位・流入元（source）を一覧
- ページネーション（50 件/ページ）
- CSV エクスポートは Phase 2

#### 3.1.6 登録者の運営側削除
- 開発者は管理画面から個別エントリを削除（ソフトデリート + 匿名化）
- スパム対策・誤登録対応用

### 3.2 エンドユーザー向け機能

#### 3.2.1 ウェイトリスト登録（埋め込みウィジェット経由）
- `<launchia-widget>` 内のメアド入力フォーム → 送信
- 必須: メアド形式バリデーション
- 任意: `require-consent="true"` 属性指定時、同意チェックボックス必須
- 送信後、Shadow DOM 内で完了画面に切り替わる（「確認メールをお送りしました。メール内のリンクから登録を完了してください」と表示）
- **ダブルオプトイン**: 登録 API は `confirmed_at = NULL` でエントリを作成し、登録完了画面では順位を表示しない。ユーザーがメール内の順位確認 URL を **初回クリック** したタイミングで `confirmed_at` がセットされ、rank に算入される

#### 3.2.2 ウェイトリスト登録（アイデアページ経由）
- `launchia.net/p/<slug>` を訪問
- ページに表示: プロジェクト名、説明、カバー画像、（LP URL があれば）「LP を見る」リンク、CTA「ウェイトリストに登録」
- CTA タップ → 同ページ内モーダルでメアド入力 → 送信 → 完了表示

#### 3.2.3 順位確認 URL（マジックリンク）
- 登録完了メールに `https://launchia.net/r/<token>` を記載
- アクセスすると、現在の順位とプロジェクト名のみを表示（メアドや名前は表示しない）
- 何度アクセスしても OK（マルチタイム、無期限）
- 「登録解除」ボタンを設置

#### 3.2.4 登録解除
- 順位確認 URL から「登録解除」ボタン押下 → 確認ダイアログ → 解除実行
- ソフトデリート + メール匿名化（`email` を `deleted-<entry_id>@anonymized.local` に置換、`deleted_at` セット）
- `position` は変更しない（穴を残す）。他ユーザーの順位が動かない UX を優先し、後続エントリ一斉 UPDATE のコストも回避する。総数表示は `deleted_at IS NULL` でフィルタする

### 3.3 システム機能

#### 3.3.1 メール送信（Resend 経由）
**送信元**: `noreply@launchia.net`（SPF / DKIM / DMARC 設定済）
**Reply-To**: プロジェクトオーナー開発者のメアド（エンドユーザー向けメールのみ）

| 種別 | トリガー | 件名 | 主な内容 |
| :--- | :--- | :--- | :--- |
| Magic Link（開発者ログイン） | `POST /api/v1/auth/magic-link` | Launchia へのログインリンク | ボタン 1 個、15 分有効、IP/User-Agent 表示 |
| 登録確認メール（エンドユーザー） | 新規エントリ作成 / 未確認エントリへの再登録時 | [{プロジェクト名}] ウェイトリスト登録の確認をお願いします | 「登録を完了する」ボタン（順位確認 URL）、確認しないと順位に算入されない旨の注意 |
| 登録完了メール（エンドユーザー） | `/r/<token>` 初回アクセスで `confirmed_at` セット時（just_confirmed） | 【保管してください】{プロジェクト名} ウェイトリスト登録が完了しました | 順位、**順位確認リンク（保管推奨を強調）**、登録解除もこのリンクから行える旨。メール紛失対策として「大切に保管」を黄色ボックスで強調 |
| 登録解除完了通知（エンドユーザー） | 解除実行成功時 | [{プロジェクト名}] ウェイトリスト登録解除のお知らせ | 解除完了の通知 |

> **登録完了メールの意図**: 確認依頼メール（1通目）は「リンクを開いて確認」が目的で、ユーザーはこれを保管しない傾向がある。本登録完了の瞬間（順位確定時）にもう一通、**「これが今後の順位確認・登録解除に使う専用リンク。保管してください」と強調**したメールを送ることで、URL 紛失をできるだけ防ぐ。根本解決（複数登録の一覧・失念対応）は Phase 2 のマイページ（`20260529_launchia_phase2_design_notes.md` 参照）。

#### 3.3.2 順位確認の閲覧ログ
- `/r/<token>` への正常アクセス時、`launchia_rank_views` に 1 行記録
- 用途: Phase 2 で熱量スコア算出のデータソース
- 重複アクセスも記録（同一トークンの 30 秒以内連続アクセスのみデバウンス）

#### 3.3.3 アクセス制御（CORS）
- パブリック API（埋め込みウィジェットから呼ばれる）は **プロジェクトの `allowed_origins` に基づいて Origin 検証**
- 空配列 (`[]`) の場合は preflight 時にすべての Origin を許可（テスト用）
- 設定がある場合は preflight でホワイトリスト照合、不一致は 403
- 開発支援: 管理画面の「localhost を許可」チェックボックスで `http://localhost:*` および `http://127.0.0.1:*` を自動で許容

---

## 4. データモデル

### 4.1 命名規則
- すべて `launchia_*` プレフィックスを付与（既存 WebForm の `inquiries` 等と同 DB 内で共存）
- 主キーは UUID v7（時系列順序保証、Drizzle で `gen_random_uuid()` または ULID 拡張）
- タイムスタンプは UTC `timestamptz`
- すべてのテーブルに `created_at`、変更可能なものは `updated_at`

### 4.2 テーブル定義

#### `launchia_users` — 開発者アカウント

| カラム | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `email` | text | UNIQUE, NOT NULL | ログイン識別子 |
| `display_name` | text | nullable | 管理画面表示用 |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

#### `launchia_magic_link_tokens` — 開発者ログイン用

| カラム | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `user_id` | uuid | FK → users.id, nullable | サインアップ初回は NULL（後で確定） |
| `email` | text | NOT NULL | サインアップ時の宛先 |
| `token_hash` | bytea | NOT NULL, INDEX | SHA-256 ハッシュ |
| `expires_at` | timestamptz | NOT NULL | 発行 15 分後 |
| `used_at` | timestamptz | nullable | 一度使ったら以降無効化 |
| `created_at` | timestamptz | NOT NULL | |

#### `launchia_invite_codes` — 招待コード

| カラム | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `code` | text | UNIQUE, NOT NULL | 例: `LCHA-XXXX-XXXX`（生成は暗号学的乱数） |
| `max_uses` | int | NOT NULL, default 1 | |
| `used_count` | int | NOT NULL, default 0 | |
| `expires_at` | timestamptz | nullable | |
| `issued_by_user_id` | uuid | FK → users.id, nullable | 運営直接発行は NULL |
| `notes` | text | nullable | 「だすね開発者向け」など |
| `created_at` | timestamptz | NOT NULL | |

#### `launchia_projects` — プロジェクト（テナント）

| カラム | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `owner_user_id` | uuid | FK → users.id, NOT NULL | |
| `slug` | text | UNIQUE, NOT NULL | URL slug `/p/<slug>`。`^[a-z0-9-]{2,40}$` |
| `name` | text | NOT NULL | 最大 80 文字 |
| `description` | text | nullable | 最大 2,000 文字、プレーンテキスト |
| `cover_image_url` | text | nullable | |
| `landing_page_url` | text | nullable | 開発者の LP URL（任意） |
| `embed_enabled` | boolean | NOT NULL, default true | |
| `idea_page_public` | boolean | NOT NULL, default false | |
| `require_consent` | boolean | NOT NULL, default false | |
| `allowed_origins` | text[] | NOT NULL, default '{}' | 空配列＝すべて許可 |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

#### `launchia_waitlist_entries` — 登録者

| カラム | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `project_id` | uuid | FK → projects.id, NOT NULL | |
| `email` | text | NOT NULL | 削除時は匿名化置換 |
| `source` | text | NOT NULL | enum: `embed` / `idea_page` / `api` |
| `consent_at` | timestamptz | nullable | 同意取得時刻 |
| `position` | int | NOT NULL | プロジェクト内シーケンシャル |
| `deleted_at` | timestamptz | nullable | ソフトデリート |
| `email_anonymized` | boolean | NOT NULL, default false | |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

**インデックス・制約**:
- `UNIQUE INDEX (project_id, email) WHERE deleted_at IS NULL` — 重複登録防止
- `INDEX (project_id, position)` — 順位検索
- `INDEX (project_id, created_at)` — 管理画面の一覧表示

#### `launchia_rank_tokens` — 順位確認 URL 用

| カラム | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `entry_id` | uuid | FK → waitlist_entries.id, NOT NULL | |
| `token_hash` | bytea | UNIQUE, NOT NULL, INDEX | SHA-256 |
| `revoked_at` | timestamptz | nullable | 登録解除時にセット |
| `created_at` | timestamptz | NOT NULL | |

#### `launchia_rank_views` — 順位確認の閲覧ログ

| カラム | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | |
| `entry_id` | uuid | FK → waitlist_entries.id, NOT NULL | |
| `viewed_at` | timestamptz | NOT NULL | |
| `user_agent_hash` | bytea | nullable | デバウンス判定用（PII にならぬよう SHA-256） |

**インデックス**:
- `INDEX (entry_id, viewed_at DESC)` — Phase 2 の熱量集計用

### 4.3 既存 WebForm との共存
- 同一 Neon DB 内で運用。テーブル名 `launchia_*` プレフィックスで名前空間を分離。
- 既存 `inquiries` テーブルはそのまま維持（変更しない）。
- Drizzle migration ファイルは `backend/src/db/migrations/launchia/` に分離。

---

## 5. API 仕様

### 5.1 全体方針
- **Base URL**: `https://api.launchia.net`（プロトタイプ期は `https://launchia-api.<account>.workers.dev` でも可）
- **バージョニング**: `/api/v1/...`
- **形式**: JSON（リクエスト・レスポンス）
- **認証**: 開発者向けエンドポイント `/api/v1/admin/*` および `/api/v1/auth/*` は HttpOnly Cookie のセッション
- **CORS**:
  - パブリック `/api/v1/public/*`: プロジェクトの `allowed_origins` で動的判定
  - 管理 `/api/v1/admin/*` `/api/v1/auth/*`: **本番は Next.js の rewrites 経由（same-origin、CORS 不要）**。開発時も同様（`next.config.ts` で `/api/*` を Workers に proxy）

### 5.2 パブリック API

| Method | Path | 概要 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/public/projects/:slug/entries` | エンドユーザーのウェイトリスト登録 |
| `GET` | `/api/v1/public/projects/:slug` | アイデアページのプロジェクト情報取得（SSR で済むなら不要） |
| `GET` | `/api/v1/public/rank/:token` | 順位確認 |
| `POST` | `/api/v1/public/rank/:token/unsubscribe` | 登録解除 |

#### `POST /api/v1/public/projects/:slug/entries`
**Request Body**:
```json
{
  "email": "user@example.com",
  "consent": true,
  "source": "embed"
}
```
**Response (201 Created, 新規登録 - 確認待ち)**:
```json
{
  "status": "pending_confirmation",
  "project_name": "だすね",
  "message": "確認メールをお送りしました。メール内のリンクから登録を完了してください。"
}
```
**Response (200 OK, 未確認エントリへの再登録 - 確認メール再送)**:
```json
{
  "status": "confirmation_resent",
  "project_name": "だすね",
  "message": "確認メールを再送しました。メールをご確認ください。"
}
```
**Response (409 Conflict, 確認済みエントリへの重複登録)**:
```json
{
  "error": "already_registered",
  "rank": 42,
  "project_name": "だすね"
}
```

注: 新規登録時は **`confirmed_at = NULL`** でエントリ作成、`rank` はレスポンスに含めない（確認後に確定するため）。重複検出時は既存エントリの `confirmed_at` を見て分岐:
- 確認済み (`confirmed_at IS NOT NULL`) → 409 + 既存 rank を返す
- 未確認 (`confirmed_at IS NULL`) → 200 + 新規トークン発行 + 確認メール再送（古いトークンは revoke）

#### `GET /api/v1/public/rank/:token`
- トークンを SHA-256 ハッシュ → `launchia_rank_tokens.token_hash` と照合
- 一致しなければ 404
- 一致したら `launchia_rank_views` に 1 行記録（30 秒デバウンス）
- レスポンス: `{ "rank": 42, "project_name": "だすね", "total_count": 1234, "just_confirmed": false }`
- **`rank` は ROW_NUMBER() による動的計算**。アクティブ (`deleted_at IS NULL`) かつ **確認済み** (`confirmed_at IS NOT NULL`) なエントリの並び順を `position ASC` でランク付けする。未確認エントリは rank・total_count に算入されない
- **初回確認時**: エントリの `confirmed_at` が NULL の場合、このアクセスで `confirmed_at = NOW()` をセット（ダブルオプトインの確定）。レスポンス `just_confirmed: true` でクライアントに通知 → UI で「登録が完了しました！」表示
- `position` は DB に保存された登録順の固定値だが、表示には用いない

#### `POST /api/v1/public/rank/:token/unsubscribe`
- トークン照合 → エントリをソフトデリート + 匿名化
- 該当トークンも `revoked_at` セット
- 解除完了メール送信

### 5.3 管理 API（認証必須）

| Method | Path | 概要 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/magic-link` | Magic Link 発行・送信 |
| `GET` | `/api/v1/auth/verify?token=<>` | Magic Link 検証 → セッション確立 |
| `POST` | `/api/v1/auth/logout` | ログアウト |
| `GET` | `/api/v1/admin/me` | 現在のユーザー情報 |
| `GET` | `/api/v1/admin/projects` | 自分のプロジェクト一覧 |
| `POST` | `/api/v1/admin/projects` | プロジェクト新規作成 |
| `GET` | `/api/v1/admin/projects/:id` | プロジェクト詳細 |
| `PATCH` | `/api/v1/admin/projects/:id` | プロジェクト編集 |
| `GET` | `/api/v1/admin/projects/:id/entries` | 登録者一覧（ページネーション） |
| `DELETE` | `/api/v1/admin/projects/:id/entries/:entryId` | 登録者削除（ソフト） |

#### `POST /api/v1/auth/magic-link`
**Request Body**:
```json
{ "email": "dev@example.com", "invite_code": "LCHA-XXXX-XXXX" }
```
- `invite_code` は新規サインアップ時のみ必須
- 既存ユーザーは `invite_code` 不要
- レスポンスはサインアップ・ログインを区別しない（`{ "sent": true }`）— 列挙攻撃防止

**注: 実装上の補足**:
- Drizzle ORM のデフォルト挙動により、admin API のレスポンス JSON は **camelCase**（`embedEnabled`, `createdAt` 等）になる。要件書のサンプル JSON は読みやすさのため一部 snake_case で書いているが、実装は camelCase が正。Phase 2 で snake_case への整形を検討
- `nullableUrl` の Zod 変換: `""` を `null` に正規化してから DB に保存

### 5.4 共通仕様
- **エラー形式**: `{ "error": "<code>", "message": "<human-readable>", "details": {...} }`
- **ステータスコード**: 200 / 201 / 400 / 401 / 403 / 404 / 409 / 429 / 500
- **レート制限**（Cloudflare Rate Limiting Rules で実装）:
  - パブリック登録: 1 IP あたり 10 req / 分
  - 順位確認: 1 トークンあたり 30 req / 分、1 IP あたり 60 req / 分
  - Magic Link 発行: 1 メアドあたり 5 req / 時間、1 IP あたり 20 req / 時間
  - 管理 API: 認証後 1 セッションあたり 300 req / 分

---

## 6. UI 仕様

### 6.1 埋め込みウィジェット `<launchia-widget>`
- **技術**: Web Components + Shadow DOM、既存 `<company-contact-form>` をベースに拡張
- **ホスティング**: Cloudflare Pages（既存 `webform-9ck.pages.dev` 流用 or 新規 Pages プロジェクト）
- **スクリプト URL**: `https://widget.launchia.net/launchia-widget.js`（CDN）
- **必須属性**:
  - `project-slug`: プロジェクトの slug
- **任意属性**:
  - `api-url`: API ベース URL（デフォルト `https://api.launchia.net`）
  - `require-consent`: `"true"` で同意チェックボックス表示
  - `theme`: `"light"` / `"dark"` （Phase 1 は light 固定でも可）
- **画面構成**:
  1. 入力フォーム（メアド、同意チェックボックス（任意）、送信ボタン）
  2. 送信中ローディング
  3. 完了画面（「確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。クリック後、あなたの順位を確認できます」） — **ダブルオプトインのため、この時点では順位を表示しない**
  4. エラー画面（通信失敗、CORS 拒否、重複登録時）

### 6.2 アイデアページ `launchia.net/p/<slug>`
- **技術**: Next.js（App Router）+ Shadcn UI、SSR
- **構成**:
  1. ヘッダー: Launchia ロゴ + 「Launchia とは？」リンク
  2. ヒーロー: プロジェクト名 + カバー画像
  3. 説明: `description` をプレーンテキスト改行で表示
  4. 「LP を見る」リンク（`landing_page_url` があるときのみ）
  5. CTA ブロック: 「ウェイトリストに登録」ボタン → モーダルで `<launchia-widget>` と同等の入力フォーム
  6. フッター: Privacy Policy、Launchia へのリンク
- **OGP**: title, description, image を動的生成
- **SEO**: `idea_page_public=true` の時のみ `<meta name="robots" content="index,follow">`、false なら 404

### 6.3 管理画面 `launchia.net/*`（認証付きルート）
- **技術**: Next.js（App Router、Tailwind CSS v4。Shadcn UI は Phase 2 で導入検討）
- **画面一覧**:
  - `/login` — メアド入力 + 招待コード（新規時）→ Magic Link 送信
  - `/auth/verify` — Magic Link クリック後の検証 → セッション Cookie 発行 → `/projects` へ redirect
  - `/projects` — 自分のプロジェクト一覧（カード表示、状態バッジ）
  - `/projects/new` — 新規作成フォーム（name, slug, description, 公開フラグ）
  - `/projects/:id` — 詳細・編集（公開設定、説明、画像、LP URL、allowed_origins）+ 統計（確認済み / 確認待ち）+ **埋め込みコード/アイデア URL のコピー UI を同ページに統合**
  - `/projects/:id/entries` — 登録者一覧（テーブル形式、状態バッジ、削除ボタン、ページネーション）
- **認証**: `/projects/*` 配下は `layout.tsx` で `/api/v1/auth/me` を Server-side fetch して未認証なら `/login` へ redirect
- **fetch 経路**:
  - Server Component から API: `INTERNAL_API_URL` 環境変数 (`http://localhost:8788` 等) で直接 Workers に
  - Client Component から API: 相対 URL (`/api/v1/...`)、Next.js の `rewrites()` で開発時は Workers に proxy、本番は同一ドメインで完結
- **セッション Cookie**: `launchia_session`、内容は `base64url(payload).base64url(HMAC-SHA256(SESSION_SECRET, payload))`、HttpOnly + SameSite=Lax + Path=/、開発時 Secure=false / 本番 Secure=true、有効期限 30 日

### 6.4 順位確認ページ `launchia.net/r/<token>`
- **技術**: Next.js（軽量、SSR）
- **構成**:
  1. **初回確認時のみ**: 「🎉 登録が完了しました！」の歓迎メッセージ（`just_confirmed: true` のとき）
  2. プロジェクト名
  3. 現在の順位（大きく表示）「あなたは 42 番目です」
  4. 「総登録者数: 1,234 人」（プロジェクト内ソーシャルプルーフ程度）
  5. 登録解除ボタン（クリックで確認ダイアログ → API 呼び出し）
- **ダブルオプトイン**: このページへの初回アクセスが「登録の確定」になる。サーバー側で `confirmed_at` をセットし、以降 `rank` / `total_count` に算入される

---

## 7. 非機能要件

### 7.1 セキュリティ
- **トークン全般**:
  - 暗号学的乱数 256 bit、URL-safe Base64 エンコード
  - DB には SHA-256 ハッシュのみ保存（平文は発行時のメールにのみ載せる）
- **Magic Link**: 15 分有効、ワンタイム
- **順位確認トークン**: プロジェクト存続中無期限、マルチタイム、メアド・名前は表示しない
- **HTTPS 強制**: HSTS（max-age=31536000）
- **HTTP ヘッダ**:
  - `Cache-Control: no-store`（順位確認・Magic Link 関連エンドポイント）
  - `Referrer-Policy: no-referrer`
  - `X-Content-Type-Options: nosniff`
- **CSP**: 埋め込みウィジェットの動作を阻害しない最小限のポリシー
- **CORS**: 5.1 を参照
- **シークレット管理**: Cloudflare Workers Secrets。フロントエンドへ秘匿情報を露出しない

### 7.2 性能
- 登録 API: < 500ms (p99)
- 順位確認 API: < 200ms (p99)
- 管理画面初期表示: < 2s (p95)

### 7.3 可用性
- Cloudflare のグローバルエッジ分散により、稼働率目標 99.9%
- Neon は単一リージョン（東京推奨）+ 自動 PITR

### 7.4 監視・ログ
- Cloudflare Workers Logs: エラー・警告レベルをすべて記録
- Cloudflare Analytics: API 呼出数・エラー率
- Resend ダッシュボード: メール配信・バウンス監視
- Sentry 等のエラートラッキング導入は Phase 1.5

### 7.5 ホスティング構成

| 要素 | サービス | URL |
| :--- | :--- | :--- |
| 埋め込みウィジェット JS | Cloudflare Pages | `https://widget.launchia.net/launchia-widget.js` |
| マーケットプレイス・アイデアページ・管理画面 | Cloudflare Pages（Next.js） | `https://launchia.net/` |
| バックエンド API | Cloudflare Workers | `https://api.launchia.net/` |
| データベース | Neon (PostgreSQL) | 接続文字列は環境変数 |
| メール送信 | Resend | API キーは Workers Secrets |

### 7.6 ドメイン構成
- `launchia.net` — ルートとマーケット／管理画面
- `api.launchia.net` — API ワーカー
- `widget.launchia.net` — 埋め込みウィジェット静的配信
- `dasune.net` — 取得済（だすね本体／第1号ショーケース）

### 7.7 環境変数（Workers Secrets）
- `DATABASE_URL` — Neon 接続文字列
- `RESEND_API_KEY` — Resend API キー
- `SESSION_SECRET` — セッション Cookie 署名鍵
- `APP_BASE_URL` — `https://launchia.net`（メール内 URL 生成用）
- `ENVIRONMENT` — `production` / `preview` / `development`

---

## 8. 既存 WebForm との関係
- **コード**: 同一リポジトリ内 (`backend/`, `frontend/`) で共存。`frontend/src/launchia/`、`backend/src/launchia/` のサブディレクトリで Launchia 用の Web Components / API ハンドラを管理。
- **共通基盤**: Hono の Repository パターン、Drizzle、Cloudflare Workers のビルド設定（wrangler）を共有。
- **DB**: 同一 Neon インスタンス、`launchia_*` プレフィックスで分離。
- **マイグレーション**: `backend/src/db/migrations/webform/` と `backend/src/db/migrations/launchia/` を分ける。

---

## 9. Phase 1 マイルストーン（実装順序の目安）

| # | マイルストーン | 完了条件 |
| :--- | :--- | :--- |
| M1 | DB スキーマ & migration | Neon に `launchia_*` テーブル全て作成済、Drizzle で型生成 |
| M2 | パブリック API（登録・順位確認・解除） | curl で 3 エンドポイントが動作、テストデータで position 採番確認 |
| M3 | 埋め込みウィジェット `<launchia-widget>` | だすね LP のローカル HTML で登録〜完了画面まで動作 |
| M4 | メール送信統合 (Resend) | Magic Link / 登録完了メールが実宛先に届く |
| M5 | 順位確認ページ `/r/<token>` | メール内 URL から再訪 → 順位表示・解除動作 |
| M6 | アイデアページ `/p/<slug>` | SSR で公開ページ表示、CTA から登録動作 |
| M7 | 開発者管理画面 | Magic Link ログイン → プロジェクト CRUD → 登録者一覧表示 → 埋め込みコード/URL コピー |
| M8 | CORS・レート制限・本番デプロイ | `launchia.net` / `api.launchia.net` / `widget.launchia.net` が独自ドメインで稼働 |
| M9 | だすね LP 適用（Dogfooding） | `dasune.net` で本番ウィジェット稼働、最初の登録 1 件を獲得 |

---

## 10. 用語集

| 用語 | 定義 |
| :--- | :--- |
| プロジェクト | 1 つのウェイトリスト単位。テナント。`launchia_projects` の 1 行 |
| 登録者 / エントリ | エンドユーザーの登録 1 件。`launchia_waitlist_entries` の 1 行 |
| `position` | DB に保存される登録順の固定値（1 から）。解除があっても変更しない（穴あり） |
| `rank` | 表示用の順位。`ROW_NUMBER() OVER (ORDER BY position)` でアクティブ (`deleted_at IS NULL`) かつ確認済み (`confirmed_at IS NOT NULL`) なエントリの並び順を動的計算した値。解除や未確認状態は算入されない |
| `confirmed_at` | ダブルオプトインの確定時刻。新規登録時は NULL、ユーザーが順位確認 URL を初回クリックした瞬間に NOW() がセットされる |
| ダブルオプトイン | 「メアド入力 → 確認メールのリンクをクリック」の 2 段階で登録を確定させる仕組み。ゴミアドレスや誤入力での件数水増しを防ぎ、開発者が見る登録者数の信頼性を担保する |
| 公開モード | LP に埋め込んで運用するモード（`embed_enabled=true`） |
| アイデアモード | `launchia.net/p/<slug>` で公開するホスト型ページモード（`idea_page_public=true`） |
| Magic Link | メアド宛に送るワンタイム認証リンク（15 分有効） |
| 順位確認 URL | エンドユーザー向けの再訪用マジックリンク（無期限、マルチタイム） |
| 招待コード | 開発者サインアップ用のコード（Phase 1 期間中の運用ガード）。`max_uses` で利用回数を制限。新規ユーザーのみ必須、既存ユーザーは不要 |
| `INTERNAL_API_URL` | Next.js Server Component から Workers API を直接呼ぶための内部 URL（開発時 `http://localhost:8788`）。Client Component は使わない |
| `NEXT_PUBLIC_API_URL` | 埋め込みウィジェットや本番アプリが Client-side で呼ぶ API URL（本番 `https://api.launchia.net`）。`embed-info.tsx` 等で参照 |
| ソリューション ID | 既存 WebForm の概念。Launchia では `project_id` / `slug` に統合 |

---

*作成日: 2026-05-28*
*作成者: Claude Code (Opus 4.7) + 瀬戸口耕司*
*ステータス: v1.0 ドラフト — レビュー待ち*
