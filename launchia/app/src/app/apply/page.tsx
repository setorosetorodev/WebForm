import Link from 'next/link'
import { ApplyForm } from './apply-form'
import { NeoStyle } from '../neo-style'

export const metadata = {
  title: '招待コードを申請｜Launchia',
}

export default function ApplyPage() {
  return (
    <main className="bg-neo-bg min-h-screen flex items-center justify-center p-4 py-10">
      <NeoStyle />
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/" className="brand-wordmark text-neo-primary">
            Launchia<span className="text-neo-orange">.</span>
          </Link>
        </div>

        <div className="bg-neo-card neo-card rounded-2xl p-8">
          <h1 className="neo-display text-2xl text-neo-fg mb-2">招待コードを申請</h1>
          <p className="neo-body text-sm text-neo-fg-soft mb-6">
            Launchia は現在<strong>招待制</strong>です。下記をお送りいただくと、運営が確認のうえ
            招待コードをメールでお送りします。
          </p>
          <ApplyForm />
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="neo-code text-sm text-neo-primary hover:underline">
            ← すでに招待コードをお持ちの方はログイン
          </Link>
        </div>
      </div>
    </main>
  )
}
