export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <div className="text-lg font-bold text-fg mb-2">プロジェクトが見つかりません</div>
        <p className="text-sm text-fg-soft leading-relaxed">
          指定されたプロジェクトは存在しないか、現在公開されていません。
        </p>
        <a
          href="https://launchia.net"
          className="inline-block mt-6 text-sm text-primary hover:underline"
        >
          Launchia へ戻る
        </a>
      </div>
    </main>
  )
}
