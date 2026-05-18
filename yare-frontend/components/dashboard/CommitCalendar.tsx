'use client'

import { cn } from '@/lib/utils'
import type { DailyProgress } from '@/lib/types'

type CellStatus = 'none' | 'valid' | 'suspicious' | 'invalid'

interface CommitCalendarProps {
  progress: DailyProgress[]
  days?: number
}

export function CommitCalendar({ progress, days = 21 }: CommitCalendarProps) {
  // 直近 days 日分のセルを生成
  const cells: { date: string; status: CellStatus }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const prog = progress.find((p) => p.date.startsWith(dateStr))

    let status: CellStatus = 'none'
    if (prog) {
      if (prog.suspicious_commit_count > 0) status = 'suspicious'
      else if (prog.is_achieved) status = 'valid'
      else if (prog.valid_commit_count === 0) status = 'none'
    }
    cells.push({ date: dateStr, status })
  }

  const cellClass: Record<CellStatus, string> = {
    none: 'bg-[#f0f0ee]',
    valid: 'bg-indigo-600',
    suspicious: 'bg-amber-400',
    invalid: 'bg-red-200',
  }

  return (
    <div>
      <div className="text-[10px] text-[#999] uppercase tracking-[0.03em] mb-1.5">
        最近{days}日のコミット
      </div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}
      >
        {cells.map(({ date, status }) => (
          <div
            key={date}
            title={date}
            className={cn('aspect-square rounded-[3px] cursor-default', cellClass[status])}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {[
          { color: 'bg-indigo-600', label: '有効' },
          { color: 'bg-amber-400', label: '審査中' },
          { color: 'bg-red-200', label: '無効' },
          { color: 'bg-[#f0f0ee]', label: 'なし' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1 text-[10px] text-[#999]">
            <div className={cn('w-2.5 h-2.5 rounded-[2px]', color)} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
