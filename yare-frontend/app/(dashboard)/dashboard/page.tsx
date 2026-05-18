'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { CommitCalendar } from '@/components/dashboard/CommitCalendar'
import { AchievementRing } from '@/components/dashboard/AchievementRing'
import { CommitsTable } from '@/components/dashboard/CommitsTable'
import { WeeklyBarChart } from '@/components/dashboard/WeeklyBarChart'
import { NotificationList } from '@/components/dashboard/NotificationList'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import type { Challenge, DailyProgress, RawCommit, Notification, ChallengeRepository } from '@/lib/types'
import { Flame, CheckCircle, Clock, Coins, Bell } from 'lucide-react'
import { formatShortDate } from '@/lib/date'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)
  const [repos, setRepos] = useState<ChallengeRepository[]>([])
  const [progress, setProgress] = useState<DailyProgress[]>([])
  const [commits, setCommits] = useState<RawCommit[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([])

  const token = getAccessToken()

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [challengesRes, notifRes] = await Promise.all([
        api.listChallenges(token),
        api.listNotifications(token),
      ])

      const challenges = challengesRes.data || []
      setAllChallenges(challenges)

      const active = challenges.find((c) => c.status === 'active') || null
      setActiveChallenge(active)

      if (active) {
        const [challengeRes, progressRes, commitsRes] = await Promise.all([
          api.getChallenge(token, active.id),
          api.getChallengeProgress(token, active.id),
          api.getChallengeCommits(token, active.id),
        ])
        setRepos(challengeRes.data.repositories || [])
        setProgress(progressRes.data || [])
        setCommits(commitsRes.data || [])
      }

      setNotifications(notifRes.data.notifications || [])
      setUnreadCount(notifRes.data.unread_count || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleMarkRead(id: string) {
    if (!token) return
    await api.markNotificationRead(token, id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  // KPI計算
  const achievedDays = progress.filter((p) => p.is_achieved).length
  const totalDays = activeChallenge
    ? Math.ceil((new Date(activeChallenge.end_date).getTime() - new Date(activeChallenge.start_date).getTime()) / 86400000) + 1
    : 0
  const remainingDays = activeChallenge
    ? Math.max(0, Math.ceil((new Date(activeChallenge.end_date).getTime() - Date.now()) / 86400000))
    : 0
  const validCommits = commits.filter((c) => c.validation_status === 'valid').length
  const totalCommits = commits.length

  // 週間コミット行数（仮: 各曜日のtotal_lines_added合計）
  const weeklyData = (() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      const ds = d.toISOString().split('T')[0]
      const prog = progress.find((p) => p.date.startsWith(ds))
      return prog?.total_lines_added || 0
    })
  })()

  // 連続日数
  const currentStreak = (() => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const prog = progress.find((p) => p.date.startsWith(ds) && p.is_achieved)
      if (prog) streak++
      else if (i > 0) break
    }
    return streak
  })()

  const completedChallenges = allChallenges.filter((c) => c.status === 'completed').length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-[#999]">読み込み中...</div>
      </div>
    )
  }

  return (
    <>
      <Topbar title="ダッシュボード" />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

        {/* KPI */}
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="継続日数"
            value={<>{achievedDays}<small className="text-[13px] text-[#999] font-normal">日</small></>}
            sub={<><span className="text-green-600 font-medium">↑ 記録更新中</span></>}
            icon={<Flame size={16} color="#7c3aed" />}
            iconBg="#ede9fe"
          />
          <KpiCard
            label="有効コミット"
            value={<>{validCommits}<small className="text-[13px] text-[#999] font-normal">/{totalCommits}</small></>}
            sub={<><span className="text-green-600 font-medium">▲ {totalCommits > 0 ? Math.round(validCommits / totalCommits * 100) : 0}%</span> 達成率</>}
            icon={<CheckCircle size={16} color="#059669" />}
            iconBg="#d1fae5"
          />
          <KpiCard
            label="残日数"
            value={<>{remainingDays}<small className="text-[13px] text-[#999] font-normal">日</small></>}
            sub={activeChallenge ? <span className="text-amber-500">{formatShortDate(activeChallenge.end_date)} まで</span> : '—'}
            icon={<Clock size={16} color="#d97706" />}
            iconBg="#fef3c7"
          />
          <KpiCard
            label="チャレンジ金額"
            value={
              <span className="text-red-600">
                ¥{activeChallenge ? activeChallenge.challenge_amount.toLocaleString() : '—'}
              </span>
            }
            sub={<>違約金（違反時）<span className="font-medium ml-1">¥{activeChallenge ? activeChallenge.penalty_amount.toLocaleString() : '—'}</span></>}
            icon={<Coins size={16} color="#dc2626" />}
            iconBg="#fee2e2"
          />
        </div>

        {/* Challenge + Ring */}
        <div className="grid grid-cols-[1.6fr_1fr] gap-3">
          <div className="bg-white rounded-xl border border-black/[0.07] p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13px] font-medium">
                <Flame size={14} className="inline text-indigo-600 mr-1 -mt-0.5" />
                アクティブチャレンジ
              </span>
              {activeChallenge && (
                <Link href={`/challenges/${activeChallenge.id}`} className="text-[11px] text-[#999] hover:text-indigo-600">
                  詳細 →
                </Link>
              )}
            </div>

            {activeChallenge ? (
              <>
                <div className="font-mono text-xs text-[#666] mb-3">
                  {repos.map((r) => r.full_name).join(', ') || '—'}
                </div>
                <div className="grid grid-cols-3 gap-2.5 mb-3.5">
                  {[
                    { label: 'ステータス', value: <span className="text-green-600">● 進行中</span> },
                    { label: '頻度', value: activeChallenge.frequency_type === 'daily' ? '毎日' : `週${activeChallenge.frequency_value}回` },
                    { label: '最小行数', value: `${activeChallenge.min_lines_per_day}行/日` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[10px] text-[#999] uppercase tracking-[0.03em] mb-0.5">{label}</div>
                      <div className="text-sm font-medium">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="flex justify-between text-[11px] text-[#999] mb-1">
                  <span>進捗</span>
                  <span className="font-medium text-indigo-600">{achievedDays} / {totalDays}日</span>
                </div>
                <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${totalDays > 0 ? (achievedDays / totalDays) * 100 : 0}%` }}
                  />
                </div>

                <div className="mt-3.5">
                  <CommitCalendar progress={progress} days={21} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <p className="text-sm text-[#999]">アクティブなチャレンジはありません</p>
                <Link
                  href="/challenges/new"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  チャレンジを作成する
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-black/[0.07] p-4">
            <AchievementRing
              achievedDays={achievedDays}
              requiredDays={totalDays}
              currentStreak={currentStreak}
              bestStreak={currentStreak}
              totalPaid={0}
              completedChallenges={completedChallenges}
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Commits table */}
          <div className="bg-white rounded-xl border border-black/[0.07] p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13px] font-medium">最近のコミット</span>
              {activeChallenge && (
                <Link href={`/challenges/${activeChallenge.id}`} className="text-[11px] text-[#999] hover:text-indigo-600">
                  すべて →
                </Link>
              )}
            </div>
            <CommitsTable commits={commits} />
          </div>

          <div className="flex flex-col gap-3">
            {/* Bar chart */}
            <div className="bg-white rounded-xl border border-black/[0.07] p-4">
              <div className="text-[13px] font-medium mb-2.5">今週のコミット行数</div>
              <WeeklyBarChart data={weeklyData} />
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-black/[0.07] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium flex items-center gap-1">
                  <Bell size={13} />通知
                </span>
                {unreadCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              <NotificationList notifications={notifications} onMarkRead={handleMarkRead} />
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
