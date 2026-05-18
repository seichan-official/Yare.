'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { CommitCalendar } from '@/components/dashboard/CommitCalendar'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Challenge, DailyProgress, RawCommit, ChallengeRepository } from '@/lib/types'
import { formatShortDate } from '@/lib/date'

const statusLabels: Record<string, { label: string; cls: string }> = {
  valid: { label: '● valid', cls: 'bg-green-50 text-green-700' },
  invalid: { label: '✕ invalid', cls: 'bg-red-50 text-red-700' },
  suspicious: { label: '◐ 審査中', cls: 'bg-amber-50 text-amber-800' },
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const token = getAccessToken()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [repos, setRepos] = useState<ChallengeRepository[]>([])
  const [progress, setProgress] = useState<DailyProgress[]>([])
  const [commits, setCommits] = useState<RawCommit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !id) return
    Promise.all([
      api.getChallenge(token, id),
      api.getChallengeProgress(token, id),
      api.getChallengeCommits(token, id),
    ]).then(([cRes, pRes, commitsRes]) => {
      setChallenge(cRes.data.challenge)
      setRepos(cRes.data.repositories || [])
      setProgress(pRes.data || [])
      setCommits(commitsRes.data || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [token, id])

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-[#9d9d99]">読み込み中...</div>
  if (!challenge) return <div className="flex-1 flex items-center justify-center text-sm text-red-600">チャレンジが見つかりません</div>

  const achievedDays = progress.filter((p) => p.is_achieved).length
  const totalDays = Math.ceil((new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / 86400000) + 1
  const validCommits = commits.filter((c) => c.validation_status === 'valid').length
  const invalidCommits = commits.filter((c) => c.validation_status === 'invalid').length
  const suspiciousCommits = commits.filter((c) => c.validation_status === 'suspicious').length

  const statusBadge = {
    active: 'bg-indigo-50 text-indigo-700',
    completed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    under_review: 'bg-amber-50 text-amber-700',
  }[challenge.status] || ''

  const statusText = {
    active: '進行中',
    completed: '達成',
    failed: '未達成',
    cancelled: 'キャンセル',
    under_review: '審査中',
  }[challenge.status] || challenge.status

  return (
    <>
      <Topbar title="チャレンジ詳細" showNewChallenge={false} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

        <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
            <div className="font-mono text-[13px] text-indigo-600 mb-1.5">
              {repos.map((r) => r.full_name).join(', ')}
            </div>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mb-4', statusBadge)}>
              {statusText}
            </span>

            {/* Meta */}
            <div className="grid grid-cols-4 gap-2.5 mb-4">
              {[
                { label: '開始日', value: formatShortDate(challenge.start_date) },
                { label: '終了日', value: formatShortDate(challenge.end_date) },
                { label: '期間', value: `${totalDays}日` },
                { label: '金額', value: `¥${challenge.challenge_amount.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg p-2.5" style={{ background: '#f8f8f7' }}>
                  <div className="text-[10px] uppercase tracking-[0.03em] mb-0.5" style={{ color: '#9d9d99' }}>{label}</div>
                  <div className="text-[13px] font-medium">{value}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="flex justify-between text-xs mb-1" style={{ color: '#9d9d99' }}>
              <span>達成進捗</span>
              <span className="font-medium text-indigo-600">{achievedDays} / {totalDays}日</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: '#f0f0ee' }}>
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${totalDays > 0 ? (achievedDays / totalDays) * 100 : 0}%` }} />
            </div>

            <CommitCalendar progress={progress} days={totalDays > 21 ? 30 : 21} />
          </div>

          <div className="flex flex-col gap-3">
            {/* Risk */}
            <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
              <div className="text-[13px] font-medium mb-2.5">本チャレンジのリスク</div>
              {/* 未達成 = challenge_amount */}
              <div className="p-3 rounded-xl text-center mb-2" style={{ background: '#fee2e2' }}>
                <div className="text-[11px] mb-1" style={{ color: '#b91c1c' }}>未達成時の引き落とし</div>
                <div className="text-[28px] font-bold text-red-600">¥{challenge.challenge_amount.toLocaleString()}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#b91c1c' }}>
                  {challenge.status === 'active' ? '達成すれば¥0' : ''}
                </div>
              </div>
              {/* 違約金 = penalty_amount（規約違反・不正時のみ） */}
              <div className="p-2.5 rounded-xl text-center" style={{ background: '#fef3c7' }}>
                <div className="text-[10px] mb-0.5" style={{ color: '#92400e' }}>規約違反・不正時の違約金</div>
                <div className="text-[18px] font-bold" style={{ color: '#b45309' }}>¥{challenge.penalty_amount.toLocaleString()}</div>
              </div>
            </div>

            {/* Validation stats */}
            <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
              <div className="text-[13px] font-medium mb-2.5">バリデーション統計</div>
              {[
                { type: 'valid', label: '有効コミット', count: validCommits, bg: '#dcfce7', color: '#15803d' },
                { type: 'invalid', label: '無効コミット', count: invalidCommits, bg: '#fee2e2', color: '#b91c1c' },
                { type: 'suspicious', label: '審査中', count: suspiciousCommits, bg: '#fef3c7', color: '#92400e' },
              ].map(({ type, label, count, bg, color }) => (
                <div key={type} className="flex items-center gap-2.5 p-2 rounded-lg mb-1.5" style={{ background: bg }}>
                  <span className="text-xs font-medium" style={{ color }}>{label}</span>
                  <span className="text-base font-semibold ml-auto" style={{ color }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commits table */}
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3">コミット一覧</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {['SHA', 'コミットメッセージ', '日時', '追加行数', '結果', '理由'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.03em]"
                    style={{ color: '#9d9d99', borderBottom: '0.5px solid #e4e4e0' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commits.map((c) => {
                const status = c.validation_status
                const scfg = status ? statusLabels[status] : null
                const dt = new Date(c.committed_at)
                const dtStr = `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-2 py-2 font-mono text-[11px] text-indigo-600" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                      {c.commit_sha.slice(0, 7)}
                    </td>
                    <td className="px-2 py-2 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                      {c.message}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap" style={{ borderBottom: '0.5px solid #f0f0ee', color: '#9d9d99' }}>
                      {dtStr}
                    </td>
                    <td className="px-2 py-2 text-green-600" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                      +{c.additions}行
                    </td>
                    <td className="px-2 py-2" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                      {scfg ? (
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', scfg.cls)}>
                          {scfg.label}
                        </span>
                      ) : <span className="text-[#9d9d99]">—</span>}
                    </td>
                    <td className="px-2 py-2 font-mono text-[10px]" style={{ borderBottom: '0.5px solid #f0f0ee', color: '#9d9d99' }}>
                      {c.reason_codes?.join(', ') || '—'}
                    </td>
                  </tr>
                )
              })}
              {commits.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6" style={{ color: '#9d9d99' }}>コミットがありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </>
  )
}
