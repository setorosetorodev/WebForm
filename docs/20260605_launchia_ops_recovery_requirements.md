# Launchia 異常系リカバリ（運用再処理）＋ 操作ログ 要件定義

> この文書が本機能の**正（信頼できる情報源）**。Phase 1 要件書（`20260528_launchia_phase1_mvp_requirements.md`）と同じ位置づけ。
> 検討の経緯は `20260529_launchia_phase2_design_notes.md` §7 に発端メモがある（本書へ集約済み）。
>
> 作成: 2026-06-05 / Claude（クロさん）＋ 瀬戸口耕司
> ステータス: **要件確定**（実装は別タスク。本書末尾の「実装フェーズ分割」を参照）

---

## 1. 背景（なぜやるか）

これまで作ってきた招待制・開発者/管理者画面は「**正常系を回す**」機能だった。だが実リリースして
第三者の開発者とそのエンドユーザー（EU）が入ると、毎日のように起きるのは**異常系**である:

- 「確認メールが迷惑メールに入った／届かない」
- 「順位確認リンクをなくした／メールを消した」

現状はこれが起きた瞬間、**開発者も管理者も代行手段がゼロ**で詰む。SaaS が「動く」ことと「運用できる」ことの
差はここにあり、本要件はその「運用できる」側を **リリースゲート** として定義する。併せて、代行操作には
必ず **監査（操作ログ）** が要るため、その基盤も同時に用意する。

2026-06-05 に全画面・全エンドポイントを精査し、EU 駆動でしかトリガーできない操作を洗い出した（§3）。

---

## 2. 役割（用語の確定）

| 役割 | 中身 | コード上の実体 | 人数（現在） |
| :--- | :--- | :--- | :--- |
| **エンドユーザ (EU)** | ウェイトリスト登録者。アカウントは持たない | `launchia_waitlist_entries` | 多数 |
| **開発者** | プロジェクト所有者。**1 Project = 1 開発者** | `launchia_projects.owner_user_id` | Project ごと 1 人 |
| **システム管理者** | 開発者の全権＋**開発者BAN**等の上位権限 | `launchia_users.is_admin` | 1 人 = `setorosetorodev@gmail.com` |

- 再処理アクションの**主体は「開発者」**（自分の Project の自分の EU に対して行う）。システム管理者は上位集合として当然できる。
- **共同開発者（1 Project に複数管理者）は将来**。やるなら `launchia_project_members(project_id, user_id, role)` を新設して
  `owner_user_id` を置き換える。**今は消費者がいないためテーブルは作らず、本メモのみ残す**（R0）。

---

## 3. 精査結果 — EU 駆動でしか起きない操作（穴の一覧）

**開発者/管理者が現在代行できる操作**: プロジェクト CRUD、エントリの**閲覧・削除のみ**
（`GET/DELETE /admin/projects/:id/entries`）、招待コード 発行/編集/上限±/論理削除/復元、招待申請 承認/却下。
→ 招待系メール（コード発行・却下）は既にシステム駆動。

**完全に EU/ユーザ駆動でしかトリガーできない操作（＝穴）**:

| 操作 / メール | 発火点 | いま再実行できるのは | 穴 |
| :--- | :--- | :--- | :--- |
| ① 登録確認メール（`sendWaitlistConfirmationEmail`） | EU 登録時 `POST /public/projects/:slug/entries` | EU が同じメアドで再登録すると自動再送（`public.ts:150`、rank_token reissue） | 開発者から**特定エントリへ再送できない** |
| ② rank 確認リンク（`rank_token`） | 登録時に発行 | 上記の再登録での reissue のみ | 開発者から**再発行・再送できない** |
| ③ Magic Link（`sendMagicLinkEmail`） | 開発者本人 `POST /auth/magic-link` | 本人のみ | （**穴ではない**。§6 参照） |
| ④ 確認完了 / ⑤ 解除完了メール | EU の `/r` 初回 / 解除時 | 再現不可（状態は一度きり） | 代行不要（状態遷移の副産物） |

→ 本質は **waitlist エントリへの運用操作が「閲覧・削除」しかない**こと。①② を埋めるのが本要件の核。

---

## 4. 要件

### R1. エントリ再処理アクション（自己宛の再送/再発行のみ）

`/admin/projects/:id/entries` の各エントリ行に運用アクションを追加する。
**宛先（メアド）を変えない、自己サービスメールの再トリガーに限定**する。

| アクション | 対象エントリ | 処理 | API（案） |
| :--- | :--- | :--- | :--- |
| 確認メール再送 | active かつ **未確認** | rank トークンを `reissueRankToken` → `sendWaitlistConfirmationEmail` を同じ email へ | `POST /admin/projects/:id/entries/:entryId/resend-confirmation` |
| 順位リンク再発行 | active かつ **確認済み** | rank トークンを `reissueRankToken` → 確認メール（リンク入り）を再送 | `POST /admin/projects/:id/entries/:entryId/reissue-rank-link` |

- **アクター**: 開発者（owner）のみ。既存の owner スコープ（`findOwnedProjectById(db, user.id, id)`）を再利用。
  システム管理者は上位集合として実行可。**owner 以外が他人の entry に対して実行 → 404（`project_not_found`）**。
  `findOwnedProjectById` は「存在しない」と「自分の所有でない」を区別せず null を返す＝**プロジェクトの存在を漏らさない**設計。
  403 にすると存在が漏れる＋「存在確認→所有者判定」でクエリ/分岐が増えるため、**あえて 404 に統一**する。
- **削除済み/匿名化エントリには出さない**（`softDeleteEntry` で email は `deleted-<id>@anonymized.local` に匿名化済み＝宛先が無い）。
- いずれも `reissueRankToken` が**旧トークンを revoke** するため、再発行後は古い `/r` リンクが失効する（重要な副作用＝仕様）。
- 既存の自動再送ロジック（`public.ts:150` の未確認再登録）はそのまま残す（EU 側の自己回復経路）。

#### やらないこと（明示的に禁止）
- **`confirmed_at` 等の状態の代理確定**（管理者が EU の代わりに「確認済み」にする）。
  ダブルオプトインの**同意を偽装**することになり、法務・信頼上アウト。本要件のスコープ外。
  将来どうしても必要なら、監査ログ必須＋「代理確定」ラベルで通常の確認と区別すること。
- **③ 開発者 Magic Link の管理者再送**（§6 参照。穴ではないのでやらない）。

### R0. 共同開発者の将来設計（メモのみ）
1 Project 複数管理者は将来課題。`launchia_project_members(project_id, user_id, role)` で `owner_user_id` を置換する想定。
**今回は実装しない**（消費者なし）。R1 のアクターは当面 `owner_user_id` 単一所有で実装する。

### R2. 操作ログ（監査）— 新テーブル `launchia_admin_actions`

代行操作・破壊的操作の痕跡を残す。**範囲＝管理操作すべて**（開発者＋システム管理者の変更系操作）。

**対象に含める**: project 作成/編集、entry 削除、確認メール再送、順位リンク再発行、招待 承認/却下/発行/論理削除/復元 など。
**対象に含めない**: 高頻度の **EU 公開トラフィック**（登録・確認・順位閲覧・解除）。これらは既存の `rank_views` と
エントリ自体（`confirmed_at` / `deleted_at` / `consent_at`）に痕跡が残るため二重取りしない。

> **量の見積もり**: 監査ログは管理操作だけを記録するので、**Project がバズっても増えない**（増えるのは EU 行為＝
> `waitlist_entries` / `rank_views`）。管理操作は超低頻度で、1 日 100 行未満 ≈ 年数十 MB（1 日 1000 行でも年 5–10 万行）。
> Neon では誤差レベル。

#### スキーマ（案）

```
launchia_admin_actions
  id              uuid pk default gen_random_uuid()
  actor_user_id   uuid  null  FK users(id) on delete set null   -- 誰が
  actor_role      text  not null                                  -- 'developer' | 'system_admin'
  action          text  not null                                  -- 'entry.resend_confirmation' 等（下記）
  project_id      uuid  null  FK projects(id) on delete set null
  target_type     text  null                                      -- 'entry' | 'invite_code' | 'invite_request' | 'project'
  target_id       text  null                                      -- 対象の id（uuid 文字列）
  target_email_enc bytea null                                     -- 宛先メールの可逆暗号化（§ ポリシー β）
  metadata        jsonb null                                      -- 任意。平文 PII は入れない
  created_at      timestamptz not null default now()
  -- index: (project_id, created_at), (target_id, action, created_at)  ← R3 のクールダウン照会に使う
```

`action` 命名（例）: `entry.resend_confirmation` / `entry.reissue_rank_link` / `entry.delete` /
`invite_request.approve` / `invite_request.reject` / `invite_code.create` / `invite_code.soft_delete` /
`invite_code.restore` / `project.create` / `project.update`。

#### 宛先メールの保存ポリシー = **β（可逆暗号化）** ← 採用

PII は 2 か所にある:
- **(A) エントリ本体のメール**: 削除時に完全匿名化（現行・不可逆、**維持**）。
- **(B) 監査ログの宛先**: 今回新設。監査ログは `entryId` を持つので**エントリ生存中は join で平文が読める**。
  論点は「**削除・匿名化後も宛先を読み戻せるようにするか**」だけ。

**採用 = β（監査優先）**: 宛先を **AES-256-GCM の可逆暗号化**で `target_email_enc` に保存する。
- 暗号は Web Crypto（`crypto.subtle`、Cloudflare Workers 標準）。形式は `iv(12B) ‖ ciphertext+tag`。
  - **保存型は `text`（base64）に変更**（当初案 bytea）。neon-http は bytea の**読み戻し**が曖昧で、暗号文を JS で復号する本用途に不向きなため、決定的な base64 TEXT にした（2026-06-05 実装時の判断）。
- 鍵 `AUDIT_ENC_KEY`（32 バイトを base64 化）は **Worker Secret**（dev は `.dev.vars`）。コミット禁止。
- **既定はマスク表示**（例 `s***v@g***l.c*m`）。**システム管理者の明示操作でのみ復号表示**する。
- **トレードオフ（明示）**: 削除しても監査ログには復号可能な形で残るため、**「忘れられる権利」の消去保証は弱まる**。
  完全消去には監査行のパージ or 鍵破棄が要る。データ管理者（=システム管理者本人）の調査責任を前提に許容する。
- 不採用案: **ハッシュ**（照合のみ・読み戻せない）、**マスキングのみ保存**（不可逆かつ部分漏洩）は「後から調べたい」要件に不適。

#### その他
- **二役**: このログを **R3 レート制限の参照元**に流用する（別テーブル不要）。
- 追加方法: **冪等・追加のみのマイグレーション**（既存 `migrate-*.ts` と同じ `CONFIRM_MIGRATE=YES` ガード）。
- 既存の招待系ルート（approve/reject/issue など）にも記録呼び出しを差して痕跡を一元化する。
  `invite_requests.handledByUserId/handledAt` 等の既存列は併存のまま（撤去しない）。

### R3. 再送のレート制限（per-entry クールダウン）

開発者/管理者経由の再送が**メール爆撃の経路にならない**よう、**同一エントリへの再送は N 分に 1 回**までに制限する。
- 実装: `launchia_admin_actions` を引き「直近 N 分以内に同 `target_id` の `entry.resend_confirmation` /
  `entry.reissue_rank_link` があれば **429**」。`N` は設定値（初期値の目安: 数分〜10分）。
- これはアプリ層の per-entry ガード。**§5 の Cloudflare エッジ・レート制限**（`/auth/magic-link` や `entries` 全体の
  IP/メアド単位の制限）は別物・別タスクとして残る。

---

## 5. スコープ外（本要件では扱わない）

- **③ 開発者 Magic Link の管理者再送** → §6（OTP へ委譲）。
- **`confirmed_at` 等の代理確定**（R1 参照。同意偽装のため禁止）。
- **共同開発者** `project_members`（R0。将来）。
- **システム管理者による他開発者プロジェクトの横断代行**（cross-project）。今回は owner スコープのみ。BAN（`users.disabled_at`）と
  合わせて将来検討。
- **Cloudflare エッジのレート制限**（Phase 2 §5 / M8）。

---

## 6. 補足: なぜ ③ Magic Link 再送は不要か

Magic Link は**自己サービス**（開発者がログイン画面から自分で何度でも発行できる）。EU の①②と違い、
**管理者が代行して送る必要が原理的に無い**。失効しても本人が再発行すればよく、「代行の穴」ではない。

一方、Magic Link 自体には別種の課題がある（Phase 2 §2 に記録済み）:
- **ブラウザ跨ぎ**: リンクが OS 既定ブラウザで開き、作業中のブラウザ/プロファイルと食い違ってログインが別側に成立。
- **プリフェッチ消費**: メールスキャナがリンクを先読みしてワンタイムトークンを消費 → 本人クリックが `invalid_token`。
- **古いリンクの取り違え**: 発行のたびにメールが溜まり、古い（失効済み）リンクを踏んで混乱。

これらの**正しい解決は OTP コードサインイン**（メールで 6 桁 → 作業中ブラウザに入力）であって、管理者再送ではない。
よって ③ は本要件から外し、**Phase 2 §2（OTP）に委譲**する。

---

## 7. 実装フェーズ分割（実装は別タスク）

| # | 内容 | 主な対象 |
| :--- | :--- | :--- |
| P1 | マイグレーション `migrate-admin-actions.ts`（`launchia_admin_actions` 追加、ガード付き・冪等）＋ `api/src/db/schema.ts` に定義追加 | api |
| P2 | 監査記録ヘルパ `recordAdminAction()` ＋ 暗号ユーティリティ（Web Crypto, `AUDIT_ENC_KEY`、暗号化/復号/マスク） | api |
| P3 | API `resend-confirmation` / `reissue-rank-link`（owner スコープ・per-entry クールダウン・監査記録）。既存 `delete`/招待系にも記録を差す | api |
| P4 | UI: エントリ画面の行アクション（状態に応じた出し分け・結果トースト・確認ダイアログ） | app |
| P5 | 監査ログ閲覧画面（システム管理者のみ・既定マスク／明示操作で復号表示） | app |

**デプロイ留意**:
- api(Worker) と migration は**手動**（`git push` では出ない。`cd launchia/api && npx wrangler deploy`、migration は `.dev.vars` の `DATABASE_URL`＝本番に CONFIRM_MIGRATE=YES で適用）。
- `AUDIT_ENC_KEY` を **prod Worker Secret** に設定する（`.dev.vars` にも dev 用を置く・コミット禁止）。

---

## 8. 受け入れ基準（検証）

- 未確認エントリ → 「確認メール再送」で新トークン発行＋メール着、**旧 `/r` トークンが無効化**される。
- 確認済みエントリ → 「順位リンク再発行」で旧リンク失効・新リンクで順位閲覧可。
- 同一エントリへ連続再送 → 2 回目が **429**（クールダウン）。
- 各操作後、`launchia_admin_actions` に actor / action / target が 1 行。`target_email_enc` は暗号化されており、
  **復号すると元アドレスに一致**。既定表示はマスク。
- **削除済み/匿名化エントリには再処理アクションが出ない**。
- **owner 以外（別の開発者）が他人の entry に再処理 → 404（`project_not_found`）**（プロジェクトの存在を漏らさないため 403 ではなく 404 に統一）。
- 既存の delete / 招待 承認・却下 等の操作でも監査行が残る。
