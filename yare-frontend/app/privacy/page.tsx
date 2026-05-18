import Link from 'next/link'

export const metadata = { title: 'プライバシーポリシー | Yare.' }

const sections = [
  {
    title: '収集する情報',
    body: '本サービスは以下の情報を収集します。①GitHubアカウント情報（ユーザーID・ユーザー名・メールアドレス・プロフィール画像）、②コミット履歴（対象リポジトリのコミット日時・メッセージ・変更ファイル数）、③決済情報（Stripe経由で管理されるカード情報。カード番号そのものは当サービスのサーバーに保存しません）、④利用規約への同意記録（日時・電子署名・IPアドレス）。',
  },
  {
    title: '情報の利用目的',
    body: '収集した情報はサービスの提供・改善、コミット達成状況の判定、課金処理、不正利用の防止、およびサービスに関する通知の送信に使用します。',
  },
  {
    title: '第三者への提供',
    body: '以下の場合を除き、ユーザーの個人情報を第三者に提供しません。①法令に基づく開示が必要な場合、②生命・財産保護のために必要な場合。決済処理にはStripe, Inc.を利用しており、カード情報はStripeのサーバーで管理されます。',
  },
  {
    title: '外部サービスの利用',
    body: '本サービスはGitHub（認証・コミット取得）、Stripe（決済処理）、Neon（データベース）、Resend（メール送信）を利用しています。各サービスのプライバシーポリシーも合わせてご確認ください。',
  },
  {
    title: 'Cookieとローカルストレージ',
    body: '本サービスはセッション管理のためにブラウザのlocalStorageにJWTトークンを保存します。これはサービスの提供に必要なものです。',
  },
  {
    title: 'データの保存期間',
    body: '退会後、ユーザーデータは90日間保持した後に削除されます。ただし、法令により保存が義務付けられるデータはこの限りではありません。',
  },
  {
    title: 'お問い合わせ',
    body: 'プライバシーに関するお問い合わせは、サービス内のお問い合わせフォームよりご連絡ください。',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-xl font-bold mb-12 block" style={{ letterSpacing: '-0.02em' }}>
          Yare<span className="text-indigo-600">.</span>
        </Link>

        <h1 className="text-2xl font-semibold mb-2">プライバシーポリシー</h1>
        <p className="text-sm mb-10" style={{ color: '#9d9d99' }}>最終更新日：2026年5月18日</p>

        <div className="flex flex-col gap-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-semibold mb-2">{s.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← トップへ戻る</Link>
        </div>
      </div>
    </div>
  )
}
