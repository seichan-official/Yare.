'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import type { Notification } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/date'

const typeConfig: Record<string, { color: string; icon: string }> = {
  challenge_failed: { color: '#ef4444', icon: '✕' },
  challenge_completed: { color: '#22c55e', icon: '✓' },
  suspicious_commit: { color: '#f59e0b', icon: '⚠' },
  payment_pre_notification: { color: '#f59e0b', icon: '¥' },
  challenge_reminder: { color: '#4f46e5', icon: '!' },
  commit_valid: { color: '#22c55e', icon: '✓' },
  commit_invalid: { color: '#ef4444', icon: '✕' },
  default: { color: '#4f46e5', icon: '·' },
}

export default function NotificationsPage() {
  const token = getAccessToken()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.listNotifications(token)
      .then((r) => setNotifications(r.data.notifications || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  async function markAllRead() {
    if (!token) return
    await Promise.all(
      notifications.filter((n) => !n.read_at).map((n) => api.markNotificationRead(token, n.id))
    )
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
  }

  async function markRead(id: string) {
    if (!token) return
    await api.markNotificationRead(token, id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  return (
    <>
      <Topbar title="通知" showNewChallenge={false} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-medium">すべての通知</h2>
          <button
            onClick={markAllRead}
            className="text-xs hover:text-indigo-600 transition-colors"
            style={{ color: '#9d9d99' }}
          >
            すべて既読にする
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-[#9d9d99]">読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#9d9d99]">通知はありません</div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n, index) => {
              const cfg = typeConfig[n.type] || typeConfig.default
              const isUnread = !n.read_at

              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && markRead(n.id)}
                  className="animate-slide-in flex gap-3 p-4 rounded-xl relative cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    background: isUnread ? '#e0e7ff' : '#fff',
                    border: `0.5px solid ${isUnread ? '#4f46e5' + '40' : '#e4e4e0'}`,
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {isUnread && (
                    <div className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: cfg.color + '22' }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium mb-1">{n.title}</div>
                    <div className="text-xs leading-[1.6]" style={{ color: '#666' }}>{n.body}</div>
                  </div>
                  <div className="text-[11px] whitespace-nowrap flex-shrink-0 mt-0.5" style={{ color: '#9d9d99' }}>
                    {formatDistanceToNow(n.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
