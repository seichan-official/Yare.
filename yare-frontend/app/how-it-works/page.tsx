import Link from 'next/link'

const FONT = { fontFamily: "'DM Sans', sans-serif" }

/** 「。」区切りで各文を block 表示 */
function Lines({ text }: { text: string }) {
  const sentences = text.split('。').filter(Boolean)
  return (
    <>
      {sentences.map((s, i) => (
        <span key={i} className="block">{s}。</span>
      ))}
    </>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0f1a', ...FONT }}>

      {/* Nav */}
      <nav className="flex items-center px-12 py-5 z-10 relative" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" className="text-[22px] font-bold text-white" style={{ letterSpacing: '-0.05em' }}>
          Yare<span style={{ color: '#6366f1' }}>.</span>
        </Link>
        <div className="ml-auto flex gap-2 items-center">
          <Link href="/signin?mode=login" className="px-3 py-[5px] rounded-lg text-[13px] transition-colors" style={{ color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.15)' }}>
            ログイン
          </Link>
          <Link href="/signin?mode=signup" className="px-3 py-[5px] rounded-lg text-[13px] bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
            アカウント作成 →
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-20 pb-14 px-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-indigo-400 mb-4">How it works</div>
        <h1 className="text-[40px] font-bold text-white mb-4" style={{ letterSpacing: '-0.04em' }}>
          Yareの仕組み
        </h1>
        <p className="text-[15px] max-w-xl mx-auto leading-[1.8]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          損失回避バイアスを活用した、GitHubコミットベースの学習継続サービスです。
        </p>
      </div>

      {/* Main flow */}
      <div className="max-w-3xl mx-auto px-8 pb-20 w-full">

        {/* Step flow */}
        <div className="flex flex-col gap-px mb-20">
          {[
            {
              step: '01',
              title: 'GitHubでアカウントを作成',
              desc: 'GitHub OAuthでサインアップします。メールアドレスとコミット履歴を取得するために public_repo 権限が必要です。登録は数秒で完了します。',
              note: null,
            },
            {
              step: '02',
              title: '利用規約に同意',
              desc: '課金の仕組み・不正コミットの禁止など、重要な8項目を1つずつ確認してチェックします。同意内容はハッシュチェーンでDBに記録され、改ざんできない形で保存されます。',
              note: '電子署名（SHA-256ハッシュチェーン）で記録',
            },
            {
              step: '03',
              title: 'カード情報を登録',
              desc: 'チャレンジ未達成時の自動課金のためにカード情報を登録します。Stripeが暗号化して管理するため、Yareはカード番号を保持しません。チャレンジを達成すれば引き落としは発生しません。',
              note: 'カード登録のみ。達成すれば¥0',
            },
            {
              step: '04',
              title: 'チャレンジを設定',
              desc: '対象リポジトリ・プログラミング言語・期間・コミット頻度・金額を自分で設定します。金額は500円〜100,000円の範囲で自由に決められます。未達成時はその金額がそのまま引き落とされます。規約違反・不正確定時の違約金は設定額の2倍（上限30,000円）です。',
              note: '¥500〜¥100,000 / 最大90日間',
            },
            {
              step: '05',
              title: '毎日コミットして学習',
              desc: 'GitHubにコミットするだけでOKです。Yareが自動でコミットを検証します。空コミット・コピペ・自動生成コードは無効と判定されます。',
              note: null,
            },
            {
              step: '06',
              title: 'チャレンジ終了・判定',
              desc: '期間終了時に達成日数を集計します。必要日数をクリアしていれば達成、課金は¥0です。未達成の場合は48時間前に予告メールが届き、設定した金額がそのまま引き落とされます。',
              note: '達成 → ¥0 / 未達成 → 設定金額を引き落とし',
            },
          ].map((s, i, arr) => (
            <div key={s.step} className="flex gap-6 relative">
              {i < arr.length - 1 && (
                <div className="absolute left-[19px] top-[40px] bottom-0 w-px" style={{ background: 'rgba(99,102,241,0.2)' }} />
              )}
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold z-10" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                {s.step}
              </div>
              <div className="pb-10 flex-1">
                <div className="text-[16px] font-semibold text-white mb-2">{s.title}</div>
                <div className="text-[13px] leading-[2]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <Lines text={s.desc} />
                </div>
                {s.note && (
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px]" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                    <span>📌</span> {s.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* コミット検証エンジン */}
        <div className="mb-16">
          <h2 className="text-[22px] font-bold text-white mb-6" style={{ letterSpacing: '-0.03em' }}>
            コミット検証エンジン
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '✕', title: '空コミット', desc: '追加・削除ともに0行のコミットは即時無効。', color: '#ef4444' },
              { icon: '✕', title: '対象外ファイルのみ', desc: '設定した言語の拡張子が含まれないコミットは無効。', color: '#ef4444' },
              { icon: '✕', title: '変更行数不足', desc: '設定した最小行数（デフォルト30行）を下回ると無効。', color: '#ef4444' },
              { icon: '✕', title: '文字の繰り返し', desc: '同一文字が30%以上連続する場合は無効。', color: '#ef4444' },
              { icon: '◐', title: 'エントロピーが低い', desc: '圧縮率が極端に高いコンテンツは審査中に。', color: '#f59e0b' },
              { icon: '◐', title: '識別子の多様性が低い', desc: '変数名・関数名のバリエーションが少ない場合は審査中に。', color: '#f59e0b' },
              { icon: '◐', title: 'コミット時刻パターン', desc: '毎日同じ時刻±5分以内のコミットは審査中に。', color: '#f59e0b' },
              { icon: '●', title: '全チェック通過', desc: '上記を全てパスしたコミットが有効とカウント。', color: '#22c55e' },
            ].map((c) => (
              <div key={c.title} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[13px] font-bold" style={{ color: c.color }}>{c.icon}</span>
                  <span className="text-[13px] font-medium text-white">{c.title}</span>
                </div>
                <div className="text-[12px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-[22px] font-bold text-white mb-6" style={{ letterSpacing: '-0.03em' }}>
            よくある質問
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                q: '達成できればお金は取られないの？',
                a: 'はい。チャレンジを達成した場合、一切の課金は発生しません。カード登録はしますが、あくまで未達成時のみ引き落とされます。',
              },
              {
                q: '審査中になったらどうなる？',
                a: '7日以内に運営からの確認メールに回答してください。実際に学習していた場合は有効と判定されます。回答がない場合は無効扱いになる可能性があります。',
              },
              {
                q: 'プライベートリポジトリは使える？',
                a: '現在のMVPではパブリックリポジトリのみ対応しています。将来的にプライベートリポジトリにも対応予定です。',
              },
              {
                q: '判定に納得できない場合は？',
                a: 'ダッシュボードから異議申し立てが可能です。運営が再審査を行い、別の担当者が最終判定を下します。',
              },
              {
                q: 'チャレンジをキャンセルできる？',
                a: 'チャレンジ作成から30分以内であればキャンセル可能です。30分経過後はキャンセルできません。',
              },
            ].map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div className="text-[13px] font-semibold text-white mb-2">Q. {q}</div>
                <div className="text-[13px] leading-[2]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  A. <Lines text={a} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.2)' }}>
          <div className="text-[28px] font-bold text-white mb-3" style={{ letterSpacing: '-0.03em' }}>
            まず試してみませんか？
          </div>
          <p className="text-[13px] mb-6 leading-[2]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span className="block">登録はGitHubアカウントで数秒。</span>
            <span className="block">チャレンジは自分のペースで設定できます。</span>
          </p>
          <Link
            href="/signin?mode=signup"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white text-[14px] font-medium hover:bg-indigo-700 transition-colors"
          >
            GitHubでアカウントを作成 →
          </Link>
        </div>
      </div>
    </div>
  )
}
