'use client'

import Link from 'next/link'
import { HelpCircle, Plus } from 'lucide-react'

interface TopbarProps {
  title: string
  showNewChallenge?: boolean
}

export function Topbar({ title, showNewChallenge = true }: TopbarProps) {
  return (
    <div className="h-14 bg-white border-b border-black/[0.07] flex items-center px-5 gap-3 flex-shrink-0">
      <span className="text-sm font-medium flex-1">{title}</span>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-black/[0.07] text-[#666] hover:bg-gray-50 transition-colors">
        <HelpCircle size={13} />
        ヘルプ
      </button>
      {showNewChallenge && (
        <Link
          href="/challenges/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={13} />
          新規チャレンジ
        </Link>
      )}
    </div>
  )
}
