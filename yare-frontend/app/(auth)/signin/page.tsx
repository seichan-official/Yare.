'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const GITHUB_SCOPES = 'read:user,user:email,public_repo'

function SignInContent() {
  const params = useSearchParams()
  const mode = params.get('mode') ?? 'signup'
  const isLogin = mode === 'login'

  const callbackURL = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'http://localhost:3000/auth/callback'

  const githubOAuthURL =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}` +
    `&scope=${GITHUB_SCOPES}` +
    `&redirect_uri=${encodeURIComponent(callbackURL)}`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f8f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex flex-col items-center gap-6 w-full max-w-[400px] px-6">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold" style={{ letterSpacing: '-0.02em', fontFamily: "'DM Sans', sans-serif" }}>
          Yare<span className="text-indigo-600">.</span>
        </Link>

        {/* Tab switcher */}
        <div className="flex w-full rounded-xl p-1 gap-1" style={{ background: '#f0f0ee' }}>
          {[
            { label: 'ログイン', value: 'login' },
            { label: '新規登録', value: 'signup' },
          ].map(({ label, value }) => (
            <Link
              key={value}
              href={`/signin?mode=${value}`}
              className="flex-1 text-center py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{
                background: mode === value ? '#fff' : 'transparent',
                color: mode === value ? '#111' : '#9d9d99',
                boxShadow: mode === value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-xl p-8 flex flex-col gap-5" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-center">
            <div className="text-xl font-semibold mb-1.5">
              {isLogin ? 'おかえりなさい' : 'アカウントを作成'}
            </div>
            <div className="text-[13px] leading-[1.6]" style={{ color: '#9d9d99' }}>
              {isLogin ? (
                <>GitHubアカウントでログインします。</>
              ) : (
                <>GitHubアカウントで登録します。<br />コミット履歴を取得するために必要です。</>
              )}
            </div>
          </div>

          <a
            href={githubOAuthURL}
            className="flex items-center justify-center gap-3 w-full py-3 px-5 rounded-xl text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
            style={{ background: '#0f0f1a' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {isLogin ? 'GitHubでログイン' : 'GitHubでアカウントを作成'}
          </a>

          {/* OAuth scopes — 新規登録時のみ表示 */}
          {!isLogin && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: '#e4e4e0' }} />
                <span className="text-xs" style={{ color: '#9d9d99' }}>取得する権限</span>
                <div className="flex-1 h-px" style={{ background: '#e4e4e0' }} />
              </div>
              {[
                ['read:user', 'プロフィール情報の読み取り'],
                ['user:email', 'メールアドレスの取得'],
                ['public_repo', 'パブリックリポジトリのコミット取得'],
              ].map(([scope, desc]) => (
                <div key={scope} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">{scope}</span>
                  <span className="text-xs" style={{ color: '#9d9d99' }}>{desc}</span>
                </div>
              ))}
            </>
          )}

          {/* Login note */}
          {isLogin && (
            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: '#f8f8f7' }}>
              <span className="text-indigo-500 text-sm flex-shrink-0">ℹ</span>
              <p className="text-[11px] leading-[1.5] m-0" style={{ color: '#9d9d99' }}>
                登録済みのGitHubアカウントでログインします。初回ログインの場合は自動的に新規登録されます。
              </p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-center leading-[1.6]" style={{ color: '#9d9d99' }}>
          {isLogin ? 'アカウントをお持ちでない方は' : '登録することで'}
          {isLogin ? (
            <Link href="/signin?mode=signup" className="text-indigo-600 hover:underline ml-0.5">新規登録</Link>
          ) : (
            <>
              <Link href="/terms" className="text-indigo-600 hover:underline">利用規約</Link>
              および
              <Link href="/privacy" className="text-indigo-600 hover:underline">プライバシーポリシー</Link>
              に同意したものとみなされます。
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
