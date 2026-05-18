'use client'

import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/date'

interface NotificationListProps {
  notifications: Notification[]
  onMarkRead?: (id: string) => void
}

const typeColors: Record<string, string> = {
  challenge_failed: 'bg-red-400',
  challenge_completed: 'bg-green-400',
  suspicious_commit: 'bg-amber-400',
  payment_pre_notification: 'bg-amber-400',
  challenge_reminder: 'bg-indigo-500',
  commit_valid: 'bg-green-400',
}

export function NotificationList({ notifications, onMarkRead }: NotificationListProps) {
  if (notifications.length === 0) {
    return <p className="text-xs text-[#999] py-2">通知はありません</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.slice(0, 4).map((n) => (
        <div
          key={n.id}
          className={cn(
            'flex items-start gap-2.5 p-2 rounded-lg bg-[#f8f8f8] cursor-pointer hover:bg-gray-100 transition-colors',
            !n.read_at && 'ring-1 ring-inset ring-indigo-100'
          )}
          onClick={() => onMarkRead?.(n.id)}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full mt-1 flex-shrink-0',
              typeColors[n.type] || 'bg-indigo-500'
            )}
          />
          <div>
            <div className="text-xs text-[#111] leading-[1.4]">{n.body}</div>
            <div className="text-[10px] text-[#999] mt-0.5">
              {formatDistanceToNow(n.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
