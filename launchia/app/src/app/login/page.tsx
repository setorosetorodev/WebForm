import { LoginForm } from './login-form'
import { NeoStyle } from '../neo-style'

export const metadata = {
  title: 'ログイン｜Launchia 管理画面',
}

export default function LoginPage() {
  return (
    <main className="bg-neo-bg min-h-screen flex items-center justify-center p-4">
      <NeoStyle />
      <div className="bg-neo-card neo-card rounded-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="brand-wordmark text-neo-primary">
            Launchia<span className="text-neo-orange">.</span>
          </div>
          <p className="neo-body text-sm text-neo-fg-soft mt-1">開発者向け管理画面</p>
        </div>

        <LoginForm />

        <div className="neo-body text-xs text-neo-fg-faint text-center mt-8 leading-relaxed">
          パスワードは不要です。
          <br />
          メールに届くコードを入力してログインします。
          <br />
          新規の方は招待コードが必要です。
        </div>

        <div className="text-xs text-center mt-6 flex items-center justify-center gap-3">
          <a href="/apply" className="neo-code text-neo-primary hover:underline">
            招待コードを申請する
          </a>
          <span className="text-neo-fg-faint" aria-hidden="true">
            ·
          </span>
          <a
            href="/privacy"
            className="neo-code text-neo-fg-faint hover:text-neo-fg-soft hover:underline"
          >
            プライバシーポリシー
          </a>
        </div>
      </div>
    </main>
  )
}
