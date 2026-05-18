'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { saveTokens, saveUser } from '@/lib/auth'

function CallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const code = params.get('code')
    const errorParam = params.get('error')

    if (errorParam) {
      setError('GitHubログインがキャンセルされました')
      return
    }

    if (!code) {
      setError('認証コードが見つかりません')
      return
    }

    ;(async () => {
      try {
        const res = await api.githubCallback(code)
        const { access_token, refresh_token, user } = res.data

        saveTokens(access_token, refresh_token)
        saveUser(user)

        // 年齢確認が未完了 → age-verify
        if (!user.age_verified) {
          router.replace('/age-verify')
        // 規約未同意 → consent
        } else if (user.agreement_status === 'not_agreed') {
          router.replace('/consent')
        // それ以外はすべてダッシュボード
        // ※カード登録は consent → setup-payment の流れで案内
        } else {
          router.replace('/dashboard')
        }
      } catch (e: unknown) {
        console.error('Auth error:', e)
        let msg = 'ログインに失敗しました'
        if (e instanceof TypeError && e.message.includes('fetch')) {
          msg = 'バックエンドサーバーに接続できません（localhost:8080 が起動しているか確認してください）'
        } else if (e && typeof e === 'object' && 'error' in e) {
          msg = (e as { error: { message: string } }).error.message
        } else if (e instanceof Error) {
          msg = e.message
        }
        setError(msg)
      }
    })()
  }, [params, router])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f8f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-red-600 text-sm">{error}</div>
        <a href="/signin" className="text-indigo-600 text-sm hover:underline">
          ログインページへ戻る
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f8f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm" style={{ color: '#9d9d99' }}>GitHubで認証中...</p>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  )
}
