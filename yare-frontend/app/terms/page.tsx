import Link from 'next/link'

export const metadata = { title: '利用規約 | Yare.' }

const sections = [
  {
    title: '第1条（適用）',
    body: '本規約は、Yare.（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。',
  },
  {
    title: '第2条（サービス内容）',
    body: '本サービスは、プログラミング学習の継続を支援するため、ユーザーが自ら設定した目標に対してコミット達成状況を記録し、未達成の場合に事前に登録したクレジットカードへ請求を行うサービスです。',
  },
  {
    title: '第3条（登録・認証）',
    body: 'ユーザーはGitHubアカウントを用いて本サービスに登録します。18歳未満の方は本サービスを利用できません。虚偽の年齢を申告した場合、一切の責任はユーザーが負うものとします。',
  },
  {
    title: '第4条（チャレンジと課金）',
    body: 'ユーザーは任意の金額・期間・リポジトリを設定してチャレンジを開始できます。期間中に設定したコミット条件を満たせなかった場合、ユーザーが設定した金額が登録済みのクレジットカードに請求されます。課金はStripeを通じて処理されます。',
  },
  {
    title: '第5条（禁止事項）',
    body: '①虚偽情報の登録、②不正な方法によるコミット操作、③他者への権利譲渡、④その他法令または公序良俗に反する行為を禁じます。',
  },
  {
    title: '第6条（免責事項）',
    body: '本サービスは現状提供であり、コミット判定・課金処理に関するいかなる保証も行いません。システム障害・外部サービス（GitHub・Stripe等）の不具合による損害について、当サービスは責任を負いません。',
  },
  {
    title: '第7条（退会）',
    body: 'ユーザーはいつでも退会できます。ただし、進行中のチャレンジがある場合は退会できません。退会後もすでに確定した請求は有効です。',
  },
  {
    title: '第8条（規約変更）',
    body: '本規約は予告なく変更される場合があります。変更後も本サービスを継続利用した場合、変更後の規約に同意したものとみなします。',
  },
  {
    title: '第9条（準拠法）',
    body: '本規約は日本法に準拠し、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-xl font-bold mb-12 block" style={{ letterSpacing: '-0.02em' }}>
          Yare<span className="text-indigo-600">.</span>
        </Link>

        <h1 className="text-2xl font-semibold mb-2">利用規約</h1>
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
