'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import type { Challenge } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/lib/date'

const statusConfig = {
  active: { label: '進行中', cls: 'bg-indigo-50 text-indigo-700' },
  completed: { label: '達成', cls: 'bg-green-50 text-green-700' },
  failed: { label: '未達成', cls: 'bg-red-50 text-red-700' },
  cancelled: { label: 'キャンセル', cls: 'bg-gray-100 text-gray-500' },
  under_review: { label: '審査中', cls: 'bg-amber-50 text-amber-700' },
} as const

export default function ChallengesPage() {
  const token = getAccessToken()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.listChallenges(token)
      .then((r) => setChallenges(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  return (
    <>
      <Topbar title="チャレンジ" />
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="text-sm text-[#9d9d99]">読み込み中...</div>
        ) : challenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4">
            <p className="text-sm text-[#9d9d99]">チャレンジがありません</p>
            <Link href="/challenges/new" className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
              最初のチャレンジを作成する
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {challenges.map((c, i) => {
              const totalDays = Math.ceil((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000) + 1
              const scfg = statusConfig[c.status] || { label: c.status, cls: '' }

              return (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  className="animate-fade-up bg-white rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  style={{ border: '0.5px solid #e4e4e0', animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-xs text-indigo-600 mb-1">
                        {c.languages.join(', ')}
                      </div>
                      <div className="text-[13px] font-medium">
                        {formatShortDate(c.start_date)} → {formatShortDate(c.end_date)}
                        <span className="text-[#9d9d99] font-normal ml-2 text-xs">({totalDays}日間)</span>
                      </div>
                    </div>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', scfg.cls)}>
                      {scfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs" style={{ color: '#9d9d99' }}>
                    <span>¥{c.challenge_amount.toLocaleString()}</span>
                    <span>違反金 ¥{c.penalty_amount.toLocaleString()}</span>
                    <span>{c.frequency_type === 'daily' ? '毎日' : `週${c.frequency_value}回`}</span>
                    <span>{c.min_lines_per_day}行/日</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
