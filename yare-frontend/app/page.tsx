import Link from 'next/link'
import { Lock, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#0f0f1a', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 40%)',
        }}
      />

      {/* Nav */}
      <nav className="flex items-center px-12 py-5 z-10 relative animate-fade-up">
        <div className="text-[22px] font-bold text-white" style={{ letterSpacing: '-0.05em' }}>
          Yare<span style={{ color: '#6366f1' }}>.</span>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <Link
            href="/signin?mode=login"
            className="px-3 py-[5px] rounded-lg text-[13px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.15)' }}
          >
            ログイン
          </Link>
          <Link
            href="/signin?mode=signup"
            className="px-3 py-[5px] rounded-lg text-[13px] bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            アカウント作成 →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 relative px-12 text-center pb-16">

        <div
          className="animate-fade-up text-[80px] font-bold text-white mb-3 leading-none"
          style={{ letterSpacing: '-0.04em', animationDelay: '40ms' }}
        >
          Yare<span style={{ color: '#6366f1' }}>.</span>
        </div>

        <p
          className="animate-fade-up text-[18px] font-medium mb-3"
          style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em', animationDelay: '120ms' }}
        >
          プログラミング学習継続支援サービス
        </p>

        <h1
          className="animate-fade-up text-[44px] font-bold text-white leading-[1.2] mb-6 text-center"
          style={{ letterSpacing: '-0.05em', animationDelay: '200ms' }}
        >
          <span className="block">学習を続けなければ、</span>
          <span className="block" style={{ color: '#6366f1' }}>お金が消える。</span>
        </h1>

        <p
          className="animate-fade-up text-[14px] mb-9 leading-[1.9]"
          style={{ color: 'rgba(255,255,255,0.45)', animationDelay: '280ms' }}
        >
          <span className="block">GitHubのコミットで学習を証明。</span>
          <span className="block">達成できなければ自分で設定した金額が引き落とされる。</span>
          <span className="block">損失回避バイアスを使った、新しい学習継続サービス。</span>
        </p>

        <div className="animate-fade-up flex gap-3" style={{ animationDelay: '360ms' }}>
          <Link
            href="/signin?mode=signup"
            className="px-7 py-3 rounded-lg text-[14px] bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            GitHubでアカウントを作成 →
          </Link>
          <Link
            href="/how-it-works"
            className="px-7 py-3 rounded-lg text-[14px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.15)' }}
          >
            仕組みを見る
          </Link>
        </div>

        <div
          className="animate-fade-up flex gap-10 mt-14 pt-8"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', animationDelay: '440ms' }}
        >
          {[['2,847', '登録ユーザー'], ['91%', 'チャレンジ達成率'], ['¥0', '払った人の割合（達成者）']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-bold text-white">{v}</div>
              <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pain points → Solution */}
      <div className="relative z-10 px-12 pb-20">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-10">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-indigo-400 mb-3">Pain Points</div>
            <h2 className="text-[28px] font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
              こんな経験、ありませんか？
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-12">
            {[
              '学習を始めても、3日も経たずにやめてしまった',
              '「明日からやろう」を何度も繰り返している',
              '高い受講料を払ったのに、結局ほとんど続かなかった',
              '意志の力だけでは継続できないと、薄々気づいている',
            ].map((text, i) => (
              <div
                key={text}
                className="animate-fade-up p-4 rounded-xl transition-all duration-200 hover:bg-white/[0.06]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderLeft: '2px solid rgba(99,102,241,0.4)',
                  animationDelay: `${i * 70}ms`,
                }}
              >
                <span className="text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.55)' }}>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center mb-10 gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div
              className="px-4 py-1.5 rounded-full text-[13px] font-medium"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '0.5px solid rgba(99,102,241,0.3)' }}
            >
              Yare. があれば
            </div>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-20">
            {[
              {
                icon: <Lock size={18} className="text-indigo-400" />,
                title: 'お金が強制力になる',
                desc: '達成できなければ自分で決めた金額が引き落とされる。損失回避の本能が、意志の代わりに働く。',
              },
              {
                icon: <CheckCircle2 size={18} className="text-indigo-400" />,
                title: 'GitHubが証人になる',
                desc: 'コミット履歴という改ざんできない記録で達成を判定。自己申告ではなく客観的な事実で評価される。',
              },
              {
                icon: <span className="text-[22px] font-bold text-white">¥0</span>,
                title: '達成すれば一切無料',
                desc: '学習を続けた人は何も払わない。引き落とされるのは、やめた人だけ。',
              },
            ].map(({ icon, title, desc }, i) => (
              <div
                key={title}
                className="animate-fade-up p-5 rounded-xl flex flex-col gap-3 transition-all duration-200 hover:bg-indigo-500/[0.13] cursor-default"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '0.5px solid rgba(99,102,241,0.2)',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="leading-none">{icon}</div>
                <div className="text-[14px] font-semibold text-white">{title}</div>
                <div className="text-[12px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</div>
              </div>
            ))}
          </div>

          <div className="text-center mb-10">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-indigo-400 mb-3">How to start</div>
            <h2 className="text-[28px] font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
              3分で始められる
            </h2>
          </div>

          <div className="flex flex-col gap-0 mb-16">
            {[
              {
                step: '01',
                title: 'GitHubでアカウントを作成',
                desc: 'GitHubアカウントがあれば、OAuthで数秒で登録完了。メールアドレスは自動取得されます。',
              },
              {
                step: '02',
                title: 'チャレンジの条件を決める',
                desc: '対象リポジトリ・期間（7〜90日）・コミット頻度・金額（¥500〜）を自分で自由に設定します。カード情報は未達成時のみ使用されます。',
              },
              {
                step: '03',
                title: 'あとは毎日コミットするだけ',
                desc: 'GitHubにコミットすれば自動で記録されます。期間終了時に達成していれば、引き落としは一切ありません。',
              },
            ].map((s, i, arr) => (
              <div key={s.step} className="flex gap-5 relative">
                {i < arr.length - 1 && (
                  <div className="absolute left-[19px] top-[44px] bottom-0 w-px" style={{ background: 'rgba(99,102,241,0.25)' }} />
                )}
                <div
                  className="flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center text-[11px] font-semibold z-10"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' }}
                >
                  {s.step}
                </div>
                <div className="pb-8 flex-1">
                  <div className="text-[15px] font-semibold text-white mb-1.5">{s.title}</div>
                  <div className="text-[13px] leading-[1.8]" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="text-center py-14 px-8 rounded-2xl transition-all duration-300 hover:bg-indigo-500/[0.12]"
            style={{ background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.2)' }}
          >
            <h3 className="text-[26px] font-bold text-white mb-3" style={{ letterSpacing: '-0.03em' }}>
              今度こそ、続けてみませんか。
            </h3>
            <p className="text-[14px] mb-8 leading-[1.8]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span className="block">登録は無料。チャレンジを達成すれば、お金は一切かかりません。</span>
              <span className="block">やめたときだけ、自分が決めた金額を払う。それだけです。</span>
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/signin?mode=signup"
                className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-[14px] font-medium hover:bg-indigo-700 transition-colors"
              >
                GitHubでアカウントを作成 →
              </Link>
              <Link
                href="/how-it-works"
                className="px-8 py-3 rounded-xl text-[14px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)', border: '0.5px solid rgba(255,255,255,0.15)' }}
              >
                仕組みを詳しく見る
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
