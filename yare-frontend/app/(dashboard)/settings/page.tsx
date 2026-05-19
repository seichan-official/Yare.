'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { getUser, clearTokens, getAccessToken } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface UserInfo {
  github_login: string
  email: string
  avatar_url?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [notif, setNotif] = useState({
    email: true,
    app: true,
    reminder: true,
    preview: false,
  })
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)

  useEffect(() => {
    const u = getUser<UserInfo>()
    setUser(u)
  }, [])

  const initials = user?.github_login?.slice(0, 2).toUpperCase() || 'YU'

  function toggleNotif(key: keyof typeof notif) {
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleWithdraw() {
    const token = getAccessToken()
    if (!token) return
    setWithdrawing(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        clearTokens()
        router.push('/signin')
        return
      }
      if (res.status === 409) {
        alert('アクティブなチャレンジがあるため退会できません。チャレンジ終了後に再度お試しください。')
        return
      }
      if (!res.ok) throw new Error()
      clearTokens()
      router.push('/')
    } catch {
      alert('退会処理に失敗しました。もう一度お試しください。')
    } finally {
      setWithdrawing(false)
      setShowWithdrawConfirm(false)
    }
  }

  return (
    <>
      <Topbar title="設定" showNewChallenge={false} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

        {/* Profile */}
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3.5">プロフィール</div>
          <div className="flex items-center gap-3.5 mb-4 pb-4" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
            <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-lg font-semibold text-white">
              {initials}
            </div>
            <div>
              <div className="text-[15px] font-medium">{user?.github_login || '---'}</div>
              <div className="font-mono text-xs" style={{ color: '#9d9d99' }}>
                github.com/{user?.github_login || '---'}
              </div>
            </div>
            <button className="ml-auto px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-gray-50" style={{ border: '0.5px solid #e4e4e0', color: '#666' }}>
              GitHubで更新
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '表示名', value: user?.github_login || '' },
              { label: 'メールアドレス', value: user?.email || '' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[11px] mb-1" style={{ color: '#9d9d99' }}>{label}</div>
                <input
                  defaultValue={value}
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                  style={{ border: '0.5px solid #e4e4e0', fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3.5">登録カード</div>
          <div className="flex items-center gap-3 p-3 rounded-xl mb-2.5" style={{ border: '0.5px solid #e4e4e0' }}>
            <div className="w-9 h-6 rounded bg-[#0f0f1a] flex items-center justify-center text-[10px] font-bold text-white">VISA</div>
            <div>
              <div className="text-[13px] font-medium">•••• •••• •••• 4242</div>
              <div className="text-[11px]" style={{ color: '#9d9d99' }}>有効期限 12/27</div>
            </div>
            <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">有効</span>
            <button className="px-2.5 py-1 rounded-lg text-[11px] border transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200" style={{ border: '0.5px solid #e4e4e0', color: '#666' }}>
              削除
            </button>
          </div>
          <button className="px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium">
            + 新しいカードを追加
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3.5">通知設定</div>
          {[
            { key: 'email' as const, label: 'メール通知', desc: '課金通知・審査通知など重要な通知をメールで受け取る' },
            { key: 'app' as const, label: 'アプリ内通知', desc: 'すべての通知をアプリ内で表示する' },
            { key: 'reminder' as const, label: '未コミットリマインダー', desc: 'コミットがない日の22時にリマインドメールを送信' },
            { key: 'preview' as const, label: '新機能プレビュー', desc: 'ベータ機能の早期アクセスに参加する' },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center gap-3 py-2.5"
              style={{ borderBottom: '0.5px solid #f0f0ee' }}
            >
              <div className="flex-1">
                <div className="text-[13px] font-medium">{label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#9d9d99' }}>{desc}</div>
              </div>
              <div
                onClick={() => toggleNotif(key)}
                className="relative w-10 h-[22px] rounded-full cursor-pointer transition-colors flex-shrink-0"
                style={{ background: notif[key] ? '#4f46e5' : '#e4e4e0' }}
              >
                <div
                  className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: notif[key] ? '21px' : '3px' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3.5">危険な操作</div>
          <div className="flex gap-2.5 mb-2">
            <button className="px-3 py-1.5 rounded-lg text-[11px] border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" style={{ border: '0.5px solid #e4e4e0', color: '#666' }}>
              同意ログをエクスポート
            </button>
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-[11px] border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              style={{ border: '0.5px solid #e4e4e0', color: '#666' }}
            >
              退会する
            </button>
          </div>
          <p className="text-[11px] leading-[1.6] m-0" style={{ color: '#9d9d99' }}>
            退会後も取引履歴・同意ログは法的要件に基づき7年間保持されます。アクティブなチャレンジがある場合は退会できません。
          </p>
        </div>

      </div>

      {/* 退会確認モーダル */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4" style={{ border: '0.5px solid #e4e4e0' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm flex-shrink-0">!</div>
              <div className="text-[15px] font-semibold">本当に退会しますか？</div>
            </div>
            <p className="text-[13px] leading-[1.7]" style={{ color: '#666' }}>
              退会するとアカウントが削除されます。取引履歴・同意ログは法的要件に基づき7年間保持されます。この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-[13px] border transition-colors hover:bg-gray-50"
                style={{ border: '0.5px solid #e4e4e0', color: '#666' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {withdrawing ? '処理中...' : '退会する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
