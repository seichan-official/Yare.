'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Challenge, RawCommit } from '@/lib/types'

const statusConfig = {
  valid:      { label: '● valid',  cls: 'bg-green-50 text-green-700' },
  invalid:    { label: '✕ invalid', cls: 'bg-red-50 text-red-700' },
  suspicious: { label: '◐ 審査中', cls: 'bg-amber-50 text-amber-800' },
} as const

export default function CommitsPage() {
  const token = getAccessToken()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [commitMap, setCommitMap] = useState<Record<string, RawCommit[]>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.listChallenges(token).then(async (r) => {
      const list = r.data || []
      setChallenges(list)
      if (list.length > 0) setSelected(list[0].id)

      // 全チャレンジのコミットを並列取得
      const entries = await Promise.all(
        list.map(async (c) => {
          try {
            const res = await api.getChallengeCommits(token, c.id)
            return [c.id, res.data || []] as const
          } catch {
            return [c.id, []] as const
          }
        })
      )
      setCommitMap(Object.fromEntries(entries))
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [token])

  const displayedCommits = selected ? (commitMap[selected] || []) : []
  const selectedChallenge = challenges.find((c) => c.id === selected)

  return (
    <>
      <Topbar title="コミット履歴" showNewChallenge={false} />
      <div className="flex-1 overflow-hidden flex">

        {/* チャレンジ選択サイドバー */}
        <div className="w-52 flex-shrink-0 flex flex-col py-4 overflow-y-auto" style={{ borderRight: '0.5px solid #e4e4e0', background: '#fafafa' }}>
          <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: '#9d9d99' }}>
            チャレンジを選択
          </div>
          {loading ? (
            <div className="px-3 py-2 text-xs text-[#9d9d99]">読み込み中...</div>
          ) : challenges.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#9d9d99]">チャレンジなし</div>
          ) : (
            challenges.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cn(
                  'text-left px-3 py-2.5 mx-2 rounded-lg text-[12px] transition-colors mb-0.5',
                  selected === c.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-[#666] hover:bg-gray-100'
                )}
              >
                <div className="truncate">{c.languages.slice(0, 2).join(', ')}</div>
                <div className="text-[10px] mt-0.5" style={{ color: selected === c.id ? '#6366f1' : '#9d9d99' }}>
                  {commitMap[c.id]?.length ?? '—'} コミット
                </div>
              </button>
            ))
          )}
        </div>

        {/* コミット一覧 */}
        <div className="flex-1 overflow-y-auto p-5">
          {selectedChallenge && (
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-600">{selectedChallenge.languages.join(', ')}</span>
              <span className="text-[11px] text-[#9d9d99]">
                {new Date(selectedChallenge.start_date).toLocaleDateString('ja-JP')} 〜 {new Date(selectedChallenge.end_date).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}

          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #e4e4e0' }}>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {['SHA', 'コミットメッセージ', '日時', '追加行数', '結果', '理由コード'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.03em]"
                      style={{ color: '#9d9d99', borderBottom: '0.5px solid #e4e4e0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedCommits.map((c) => {
                  const status = c.validation_status
                  const scfg = status ? statusConfig[status] : null
                  const dt = new Date(c.committed_at)
                  const dtStr = `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-indigo-600" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                        {c.commit_sha.slice(0, 7)}
                      </td>
                      <td className="px-3 py-2.5 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                        {c.message}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderBottom: '0.5px solid #f0f0ee', color: '#9d9d99' }}>
                        {dtStr}
                      </td>
                      <td className="px-3 py-2.5 text-green-600" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                        +{c.additions}
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                        {scfg
                          ? <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', scfg.cls)}>{scfg.label}</span>
                          : <span style={{ color: '#9d9d99' }}>—</span>}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px]" style={{ borderBottom: '0.5px solid #f0f0ee', color: '#9d9d99' }}>
                        {c.reason_codes?.join(', ') || '—'}
                      </td>
                    </tr>
                  )
                })}
                {displayedCommits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#9d9d99' }}>
                      {loading ? '読み込み中...' : 'コミットがありません'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
