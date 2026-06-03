# Launchia 運用メモ — DNS / メール認証 / DB リセット（2026-05-30）

Phase 1 を本番（launchia.net, Cloudflare）にデプロイした後の運用作業の記録。
同じ作業をする人（将来の自分含む）が事故らないための手順と落とし穴を残す。

---

## 1. メール送信元 `noreply@launchia.net`（Resend / Amazon SES）

### 構成
- 送信は **Resend**（バックエンドは Amazon SES, ap-northeast-1）。
- 送信元アドレス: `Launchia <noreply@launchia.net>`。
- **コード上の挙動**: `launchia/api/src/lib/email.ts` の `createEmailContext(env)` が、
  `env.ENVIRONMENT === 'production'` のとき `noreply@launchia.net`、
  それ以外は `onboarding@resend.dev`（Resend サンドボックス）を使う。
  → **`EMAIL_FROM` のような環境変数は存在しない。** 送信元はコードと `ENVIRONMENT` で決まる。
- 本番 Worker は `ENVIRONMENT=production`（commit d6a8cb6）なので、コード変更なしで `noreply@launchia.net` から送られる。

### DNS（Cloudflare 上の launchia.net ゾーン）
権威ネームサーバー: `veda.ns.cloudflare.com` / `stan.ns.cloudflare.com`

メール認証に必要なレコード（いずれも Cloudflare に登録済み・**DNS only / グレー雲**）:

| 種別 | Name | 値（要約） | 状態 |
| :--- | :--- | :--- | :--- |
| DKIM | `resend._domainkey.launchia.net` | `p=MIGf...`（公開鍵 TXT） | Verified |
| SPF (return-path) | `send.launchia.net` | `v=spf1 include:amazonses.com ~all` | Verified |
| return-path MX | `send.launchia.net` | `feedback-smtp.ap-northeast-1.amazonses.com`（prio 10） | Verified |
| DMARC | `_dmarc.launchia.net` | `v=DMARC1; p=quarantine; rua=mailto:setorosetorodev@gmail.com` | 2026-06-03 に `p=none`→`p=quarantine` へ引き上げ済（veda/stan/8.8.8.8 で確認） |

> 注: `From` はルートドメイン `launchia.net`、エンベロープ送信元（Return-Path）は
> `send.launchia.net`。受信側の SPF 判定は Return-Path（`send.launchia.net`）を見るので、
> ルートの SPF が `v=spf1 -all` でも今のメール送信は通る。

### ⚠️ ハマった落とし穴：DMARC がサブドメイン委任で影に隠れていた
- 症状: Cloudflare に正しい DMARC TXT を入れても、権威サーバーに照会すると **何も返らない**。
  外部リゾルバ（Google 8.8.8.8）には古い `v=DMARC1; p=reject` が見えていた。
- 原因: Cloudflare の launchia.net ゾーンに、**`_dmarc.launchia.net` の NS レコードが2本**あった:
  ```
  _dmarc.launchia.net  NS  dns1.onamae.com
  _dmarc.launchia.net  NS  dns2.onamae.com
  ```
  これは「`_dmarc` 配下は onamae に聞け」という **委任 (delegation)**。
  そのため Cloudflare に置いた DMARC TXT は配信されず、onamae 側の古い `p=reject` が応答していた。
- 対処: **この NS 2本を削除**。TXT の `_dmarc`（`v=DMARC1; p=none; ...`）はそのまま残す。
  削除後、権威サーバー veda/stan が正しく `v=DMARC1; p=none; ...` を返すようになった。

### ⚠️ 触ってはいけないもの
- `www.launchia.net` と `news.launchia.net` も onamae に **NS 委任**されており、
  委任先に **生きた `A 150.95.255.38`** がある（旧ホスティングの実体）。
  **これらの NS は削除しない。** 消すとそのサブドメインが丸ごと不通になる。
  Cloudflare に移すなら、先に委任先の全レコードを Cloudflare に複製してから委任を外すこと。

### 確認コマンド（外部 DNS 照会・安全）
```powershell
# 権威サーバーに直接（キャッシュを避ける）
Resolve-DnsName -Type TXT _dmarc.launchia.net -Server veda.ns.cloudflare.com
Resolve-DnsName -Type TXT send.launchia.net  -Server veda.ns.cloudflare.com
Resolve-DnsName -Type TXT resend._domainkey.launchia.net -Server veda.ns.cloudflare.com
```
受信メールのヘッダで `spf=pass` / `dkim=pass` / `dmarc=pass` を確認するのが最終チェック。

### 既知のフォローアップ（バグではない）
- 新規ドメインのため、初回は Microsoft/Outlook 系で迷惑メール判定されやすい
  （ヘッダ例: `SCL:5, CAT:SPM, SFTY:9.25`）。送信実績が貯まると改善。
- ~~数日 DMARC の集計レポート（rua）を見て問題なければ、`p=none` → `p=quarantine` に引き上げる。~~
  → **2026-06-03 完了**。`p=quarantine` に引き上げ（権威 veda/stan + 公開 8.8.8.8 で反映確認）。さらに上げるなら次は `p=reject`（要 rua 監視・送信実績が安定してから）。

---

## 2. 本番 DB（Neon）のリセット

### 背景
テスト中のデータと本番データが混在し、重複登録・削除不能が発生したため、
launchia のデータを初期状態に戻した。

### スキーマの前提（重要）
- launchia のテーブルは **`launchia_*` の7つだけ**:
  `launchia_users` / `launchia_magic_link_tokens` / `launchia_invite_codes` /
  `launchia_projects` / `launchia_waitlist_entries` / `launchia_rank_tokens` / `launchia_rank_views`
- **システム運用に必要なマスタデータ（設定・ロール等）は DB に無い。**
  実行時設定はすべて環境変数（Cloudflare Worker Secrets / `.dev.vars`）側。
  → 7テーブルを空にしても、運用に必要な固定データは何も失われない。
- 同一 Neon インスタンスに**旧 WebForm のテーブルが同居**している。リセット対象は
  必ず `launchia_*` に限定すること（他テーブルに触れない）。

### やり方
小規模（数十行）なら **Neon コンソールで直接 TRUNCATE/削除するのが手早い**。
手順を残したい・対象を厳密に絞りたい場合はスクリプト（`launchia/api/scripts/reset-db.ts`）:

```powershell
cd launchia/api
# ① ドライラン（件数表示のみ、削除しない）
npx tsx scripts/reset-db.ts
# ② 実行（全 launchia_* を TRUNCATE）＋ 招待コード1件発行
$env:CONFIRM_RESET="YES"; $env:SEED_INVITE="1"; npx tsx scripts/reset-db.ts
# 招待コードの確認
npx tsx scripts/show-invites.ts
```
- 接続先は `.dev.vars` / `.env` の `DATABASE_URL`（= 本番 Neon）。**不可逆**。
- neon-http クライアントは `sql.query(...)` を持たない。タグ付きテンプレート
  ``sql`...` ``（`check-entries.ts` と同じ書き方）を使うこと。
- リセット後は `launchia.net/login` で招待コードを使って再サインアップ →
  プロジェクトを作り直す。

### 関連スクリプト（`launchia/api/scripts/`）
| スクリプト | 用途 | 備考 |
| :--- | :--- | :--- |
| `reset-db.ts` | launchia_* を全削除＋招待コード seed | 破壊的。ガード付き |
| `show-invites.ts` | 招待コード一覧表示 | 読み取り |
| `check-entries.ts` | 直近の登録者を表示 | 読み取り |
| `check-magic-tokens.ts` | magic link トークン確認 | 読み取り |
| `seed-dev.ts` (`npm run db:seed`) | 開発用シード（dev@example.com 等） | **本番では使わない** |
| `migrate-confirmed-at.ts` | confirmed_at 列追加＋backfill | 1回限り・適用済み |
| `dev-issue-token.ts` / `dev-unconfirm.ts` | 開発デバッグ | dev 用 |

---

## 3. 現在のステータス（2026-05-30 時点）
- ✅ メール認証（SPF/DKIM/DMARC すべて pass、`noreply@launchia.net` から送信）
- ✅ 本番 DB を clean state にリセット
- ✅ M9 ドッグフーディング: 本番で だすねプロジェクト作成 → ウェイトリスト登録を E2E 確認
- **Phase 1 完了・本番稼働中**

次の候補: 未コミットの運用スクリプトを commit するか判断 / DMARC を `p=quarantine` へ /
Phase 2 着手（`docs/20260529_launchia_phase2_design_notes.md`: マイページ・OTP ログイン・
セッション管理画面・解除の二段階確認・レート制限+Turnstile）。

---
*作成: 2026-05-30 / Claude Code (Opus 4.8) + 瀬戸口耕司*
