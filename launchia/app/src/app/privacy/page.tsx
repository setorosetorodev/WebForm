import type { Metadata } from 'next'

/**
 * Launchia プライバシーポリシー（エンドユーザー＝ウェイトリスト登録者 / 開発者 共通）。
 *
 * ⚠️ これは法的レビュー前のドラフト。公開前に下記を必ず確定・確認すること:
 *   - 〔運営者名〕〔所在地〕〔お問い合わせ先メールアドレス〕〔制定日〕
 *   - §5 委託先の所在国・国外移転の根拠（Neon のリージョン等）
 *   - §7 保存期間の具体値、§8 安全管理措置の記述
 * 記載内容は launchia/api の DB スキーマ（schema.ts）に基づく実態:
 *   登録者=email/source/consent_at/confirmed_at/position/日時、
 *   rank_views=viewed_at + user_agent_hash（IP・生UAは未保存）、Cookie は開発者ログインのみ。
 */
export const metadata: Metadata = {
  title: 'プライバシーポリシー｜Launchia',
  description:
    'Launchia（ウェイトリスト・サービス）における個人情報の取り扱いについて定めたプライバシーポリシーです。',
}

const UPDATED = '2026-06-01' // 〔制定日／最終改定日：公開時に確定〕

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-line bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <a
            href="https://launchia.net"
            className="text-sm font-bold tracking-tight text-fg"
          >
            Launchia
          </a>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-bold text-fg mb-2">
          プライバシーポリシー
        </h1>
        <p className="text-xs text-fg-faint mb-8">最終改定日: {UPDATED}</p>

        <Section title="はじめに">
          <p>
            本プライバシーポリシー（以下「本ポリシー」）は、Launchia（ランシア。以下「本サービス」）
            における利用者の個人情報の取り扱いについて定めるものです。本サービスは、
            リリース前のプロダクトのためのウェイトリスト（順番待ち登録）サービスです。
          </p>
          <p>
            本ポリシーは本サービスに固有のものであり、運営者が提供する他サービスの
            プライバシーポリシーとは別に適用されます。
          </p>
        </Section>

        <Section title="1. 事業者情報">
          <ul className="list-disc pl-5 space-y-1">
            <li>サービス名：Launchia</li>
            <li>運営者：〔運営者名を記入〕</li>
            <li>所在地：〔必要に応じて記入〕</li>
            <li>お問い合わせ先：〔連絡用メールアドレスを記入〕</li>
          </ul>
        </Section>

        <Section title="2. 本サービスにおける立場">
          <p>
            本サービスでは、各ウェイトリスト（プロジェクト）は、それを開設した開発者
            （以下「プロジェクト運営者」）が運営します。登録者のメールアドレス等は、
            登録先プロジェクトのウェイトリスト運営のために、本サービスの運営者が
            取得・管理します。
          </p>
        </Section>

        <Section title="3. 取得する情報">
          <h3 className="font-semibold text-fg mt-4 mb-1">(1) ウェイトリスト登録者から取得する情報</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>メールアドレス</li>
            <li>登録経路（アイデアページ・埋め込みウィジェット等の区別）</li>
            <li>プライバシーポリシーへの同意の有無および日時（同意を求める設定の場合）</li>
            <li>メール確認（ダブルオプトイン）の完了日時</li>
            <li>ウェイトリスト内の登録順・順位</li>
            <li>登録日時・更新日時</li>
          </ul>

          <h3 className="font-semibold text-fg mt-4 mb-1">(2) 開発者（管理画面の利用者）から取得する情報</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>メールアドレス、表示名</li>
            <li>ログイン用の一時トークン、招待コードの利用状況</li>
            <li>作成したプロジェクトの設定情報</li>
          </ul>

          <h3 className="font-semibold text-fg mt-4 mb-1">(3) 自動的に取得する情報</h3>
          <p>
            順位確認ページの閲覧時に、閲覧日時と、ブラウザ情報（ユーザーエージェント）を
            <strong>ハッシュ化した値</strong>を記録します。これは不正利用の防止や重複アクセスの
            把握を目的としたもので、<strong>IP アドレスやブラウザ情報そのものは保存しません</strong>。
          </p>
        </Section>

        <Section title="4. 利用目的">
          <ul className="list-disc pl-5 space-y-1">
            <li>ウェイトリストの登録受付・管理、登録順位の算定と表示</li>
            <li>メールアドレスの確認（ダブルオプトイン）および本人への連絡</li>
            <li>登録先プロダクトのリリース等に関するお知らせの送信</li>
            <li>本サービスの提供・維持・改善、不正利用の防止</li>
            <li>お問い合わせへの対応</li>
          </ul>
        </Section>

        <Section title="5. 第三者への提供・業務委託">
          <p>
            法令に基づく場合等を除き、ご本人の同意なく個人情報を第三者に提供しません。
            ただし、本サービスの提供に必要な範囲で、以下の外部サービスに取り扱いを委託します。
            これらの委託先のサーバーは日本国外に所在する場合があります。
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>メール配信：Resend（Amazon SES を利用）</li>
            <li>データベース：Neon（PostgreSQL ホスティング）</li>
            <li>ホスティング・配信基盤：Cloudflare</li>
          </ul>
          <p className="mt-2 text-fg-faint text-sm">
            〔委託先の所在国・国外移転の根拠等は、公開前に確認のうえ追記する〕
          </p>
        </Section>

        <Section title="6. Cookie 等の利用">
          <p>
            開発者向け管理画面では、ログイン状態の維持のために Cookie を使用します。
            ウェイトリスト登録者向けの順位確認ページでは、URL に含まれる専用トークンにより
            表示を行うため、Cookie は使用しません。広告目的のトラッキングは行いません。
          </p>
        </Section>

        <Section title="7. 保存期間・削除">
          <p>
            取得した情報は、利用目的の達成に必要な期間、または本サービスの提供期間中、保存します。
          </p>
          <p>
            ウェイトリスト登録者は、登録時の確認メールに記載された順位確認ページから、
            いつでも<strong>登録を解除</strong>できます。解除後は登録情報を削除または匿名化し、
            順位の確認およびお知らせの受信はできなくなります。
          </p>
        </Section>

        <Section title="8. 安全管理措置">
          <p>
            個人情報の漏えい・滅失・毀損の防止その他の安全管理のため、通信の暗号化、
            アクセス権限の管理、トークンのハッシュ化保存等の措置を講じます。
            〔具体的な措置は公開前に精査する〕
          </p>
        </Section>

        <Section title="9. ご本人の権利・お問い合わせ">
          <p>
            ご本人は、自己の個人情報について、開示・訂正・利用停止・削除等を求めることができます。
            また、上記のとおり登録の解除はご自身で行えます。これらのご要望やお問い合わせは、
            第1項のお問い合わせ先までご連絡ください。
          </p>
        </Section>

        <Section title="10. 本ポリシーの改定">
          <p>
            本サービスは、必要に応じて本ポリシーを改定することがあります。重要な変更を行う場合は、
            本ページ上での掲示等、適切な方法でお知らせします。改定後の本ポリシーは、本ページに
            掲載した時点から効力を生じます。
          </p>
        </Section>

        <p className="text-sm text-fg-faint mt-10">制定日：{UPDATED}</p>
      </article>

      <footer className="border-t border-line mt-8">
        <div className="max-w-3xl mx-auto px-4 py-8 text-xs text-fg-faint">
          Powered by Launchia
        </div>
      </footer>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-fg mb-2">{title}</h2>
      <div className="text-sm text-fg-soft leading-relaxed space-y-3">{children}</div>
    </section>
  )
}
