'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import type { GitHubRepository } from '@/lib/types'

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C', 'C++', 'C#',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'Bash', 'SQL',
  'HTML', 'CSS', 'Elixir', 'Haskell', 'Lua', 'Perl', 'Julia', 'Zig',
  'Crystal', 'Clojure', 'F#', 'MATLAB',
]
const PERIODS = [
  { days: 7, label: '1週間' },
  { days: 14, label: '2週間' },
  { days: 30, label: '1ヶ月' },
  { days: 60, label: '2ヶ月' },
  { days: 90, label: '3ヶ月' },
]
const FREQUENCIES = [
  { type: 'daily', label: '毎日', desc: '週7回' },
  { type: 'weekly_5', label: '週5回', desc: '平日毎日' },
  { type: 'weekly_3', label: '週3回', desc: '最低3回/週' },
]

export default function NewChallengePage() {
  const router = useRouter()
  const token = getAccessToken()
  const [repos, setRepos] = useState<GitHubRepository[]>([])
  const [selectedRepos, setSelectedRepos] = useState<number[]>([])
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [periodDays, setPeriodDays] = useState(30)
  const [frequency, setFrequency] = useState('daily')
  const [minLines, setMinLines] = useState(30)
  const [amount, setAmount] = useState(5000)
  const [loading, setLoading] = useState(false)
  const [reposLoading, setReposLoading] = useState(true)
  const [langSearch, setLangSearch] = useState('')

  const penalty = Math.min(30000, Math.max(5000, amount * 2))

  useEffect(() => {
    if (!token) return
    api.listGitHubRepos(token)
      .then((r) => setRepos(r.data || []))
      .catch(() => {})
      .finally(() => setReposLoading(false))
  }, [token])

  function toggleRepo(id: number) {
    setSelectedRepos((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  function toggleLang(lang: string) {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  async function handleSubmit() {
    if (!token || selectedRepos.length === 0 || selectedLangs.length === 0) return
    setLoading(true)
    try {
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + periodDays)

      const repositoryData = repos
        .filter((r) => selectedRepos.includes(r.id))
        .map((r) => ({ github_repo_id: r.id, full_name: r.full_name }))

      const freqMap: Record<string, { type: string; value?: number }> = {
        daily: { type: 'daily' },
        weekly_5: { type: 'weekly_n', value: 5 },
        weekly_3: { type: 'weekly_n', value: 3 },
      }
      const { type: freqType, value: freqValue } = freqMap[frequency] || { type: 'daily' }

      await api.createChallenge(token, {
        repositories: repositoryData,
        languages: selectedLangs.map((l) => l.toLowerCase()),
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        frequency_type: freqType,
        frequency_value: freqValue,
        min_lines_per_day: minLines,
        challenge_amount: amount,
      })
      router.push('/dashboard')
    } catch {
      alert('チャレンジの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const summaryRepos = repos.filter((r) => selectedRepos.includes(r.id)).map((r) => r.full_name?.split('/')[1] ?? r.full_name).join(', ')
  const periodItem = PERIODS.find((p) => p.days === periodDays)
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + periodDays)
  const endDateStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`

  return (
    <>
      <Topbar title="新規チャレンジ作成" showNewChallenge={false} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>
          {/* Left form */}
          <div className="flex flex-col gap-3.5">
            {/* Repositories */}
            <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
              <div className="text-[13px] font-medium mb-3.5">対象リポジトリ <span className="text-xs text-[#9d9d99] font-normal">（最大3つ）</span></div>
              {reposLoading ? (
                <div className="text-sm text-[#9d9d99] py-2">読み込み中...</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {repos.slice(0, 10).map((r) => {
                    const sel = selectedRepos.includes(r.id)
                    return (
                      <div
                        key={r.id}
                        onClick={() => toggleRepo(r.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                        style={{
                          border: `1px solid ${sel ? '#4f46e5' : '#e4e4e0'}`,
                          background: sel ? '#e0e7ff' : '#fff',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                          style={{
                            border: `1.5px solid ${sel ? '#4f46e5' : '#e4e4e0'}`,
                            background: sel ? '#4f46e5' : '#fff',
                          }}
                        >
                          {sel && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="font-mono text-xs flex-1" style={{ color: sel ? '#4f46e5' : '#666' }}>
                          {r.full_name}
                        </span>
                        {r.private && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f0f0ee', color: '#9d9d99' }}>
                            Private
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Period */}
              <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
                <div className="text-[13px] font-medium mb-3">チャレンジ期間</div>
                <div className="flex flex-col gap-1.5">
                  {PERIODS.map((p) => {
                    const sel = periodDays === p.days
                    return (
                      <div
                        key={p.days}
                        onClick={() => setPeriodDays(p.days)}
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          background: sel ? '#e0e7ff' : '#f0f0ee',
                          border: sel ? '1px solid #4f46e5' : '1px solid transparent',
                        }}
                      >
                        <span className="text-[13px]" style={{ fontWeight: sel ? 500 : 400, color: sel ? '#4f46e5' : '#666' }}>
                          {p.label}
                        </span>
                        <span className="text-[11px]" style={{ color: sel ? '#4f46e5' : '#9d9d99' }}>{p.days}日</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Frequency + lines */}
              <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
                <div className="text-[13px] font-medium mb-3">コミット頻度</div>
                {FREQUENCIES.map((f) => {
                  const sel = frequency === f.type
                  return (
                    <div
                      key={f.type}
                      onClick={() => setFrequency(f.type)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-2 cursor-pointer transition-all"
                      style={{
                        border: `1px solid ${sel ? '#4f46e5' : '#e4e4e0'}`,
                        background: sel ? '#e0e7ff' : '#fff',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ border: `2px solid ${sel ? '#4f46e5' : '#e4e4e0'}` }}
                      >
                        {sel && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      <div>
                        <div className="text-[13px]" style={{ fontWeight: sel ? 500 : 400, color: sel ? '#4f46e5' : '#666' }}>{f.label}</div>
                        <div className="text-[11px]" style={{ color: '#9d9d99' }}>{f.desc}</div>
                      </div>
                    </div>
                  )
                })}
                <div className="mt-3">
                  <div className="text-[11px] mb-1" style={{ color: '#9d9d99' }}>1日最小変更行数</div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="range" min="10" max="200" step="5" value={minLines}
                      onChange={(e) => setMinLines(Number(e.target.value))}
                      className="flex-1"
                      style={{ accentColor: '#4f46e5' }}
                    />
                    <span className="text-[13px] font-medium min-w-[36px]">{minLines}行</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">対象プログラミング言語</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#e0e7ff', color: '#4f46e5' }}>複数選択可</span>
                </div>
                {selectedLangs.length > 0 && (
                  <span className="text-[11px] font-medium text-indigo-600">{selectedLangs.length}件選択中</span>
                )}
              </div>
              <input
                type="text"
                placeholder="言語を絞り込む..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px] mb-3 outline-none transition-colors"
                style={{
                  border: '0.5px solid #e4e4e0',
                  color: '#333',
                  background: '#fafaf9',
                }}
              />
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.filter((lang) =>
                  lang.toLowerCase().includes(langSearch.toLowerCase())
                ).map((lang) => {
                  const sel = selectedLangs.includes(lang)
                  return (
                    <div
                      key={lang}
                      onClick={() => toggleLang(lang)}
                      className="px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-all duration-150"
                      style={{
                        border: `1px solid ${sel ? '#4f46e5' : '#e4e4e0'}`,
                        background: sel ? '#e0e7ff' : '#fff',
                        color: sel ? '#4f46e5' : '#666',
                        fontWeight: sel ? 500 : 400,
                      }}
                    >
                      {sel && <span className="mr-1">✓</span>}{lang}
                    </div>
                  )
                })}
                {LANGUAGES.filter((lang) =>
                  lang.toLowerCase().includes(langSearch.toLowerCase())
                ).length === 0 && (
                  <span className="text-[12px]" style={{ color: '#9d9d99' }}>該当する言語がありません</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: amount + summary */}
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
              <div className="text-[13px] font-medium mb-3.5">チャレンジ金額</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-[32px] font-bold text-red-600">¥{amount.toLocaleString()}</span>
              </div>
              <input
                type="range" min="500" max="100000" step="500" value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full mb-3"
                style={{ accentColor: '#ef4444' }}
              />
              <div className="flex justify-between text-[11px] mb-4" style={{ color: '#9d9d99' }}>
                <span>¥500</span><span>¥100,000</span>
              </div>
              {/* 未達成時 = 設定額そのまま */}
              <div className="p-3 rounded-lg mb-2" style={{ background: '#fee2e2' }}>
                <div className="text-[11px] mb-1" style={{ color: '#b91c1c' }}>未達成時の引き落とし</div>
                <div className="text-[22px] font-bold text-red-600">¥{amount.toLocaleString()}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#b91c1c' }}>設定金額がそのまま引き落とされます</div>
              </div>
              {/* 違約金 = 規約違反・不正時のみ */}
              <div className="p-3 rounded-lg" style={{ background: '#fef3c7' }}>
                <div className="text-[11px] mb-1" style={{ color: '#92400e' }}>規約違反・不正確定時の違約金</div>
                <div className="text-[18px] font-bold" style={{ color: '#b45309' }}>¥{penalty.toLocaleString()}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#92400e' }}>（設定額 × 2倍、上限30,000円）</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #e4e4e0' }}>
              <div className="text-[13px] font-medium mb-3">確認サマリー</div>
              {[
                ['リポジトリ', summaryRepos || '—'],
                ['期間', periodItem ? `${periodItem.label}（${endDateStr}まで）` : '—'],
                ['頻度', FREQUENCIES.find((f) => f.type === frequency)?.label || '—'],
                ['最小行数', `${minLines}行/日`],
                ['言語', selectedLangs.join(', ') || '—'],
                ['未達成時', `¥${amount.toLocaleString()}`],
                ['違約金（違反時）', `¥${penalty.toLocaleString()}`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between py-1.5 text-xs"
                  style={{ borderBottom: '0.5px solid #f0f0ee' }}
                >
                  <span style={{ color: '#9d9d99' }}>{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              <button
                onClick={handleSubmit}
                disabled={loading || selectedRepos.length === 0 || selectedLangs.length === 0}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors mt-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '作成中...' : 'チャレンジを開始する →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
