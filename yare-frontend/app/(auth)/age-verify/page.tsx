'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function validateAge(year: string, month: string, day: string): string | null {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)

  if (!year || !month || !day) return '生年月日を入力してください'
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '正しい日付を入力してください'
  if (y < 1900 || y > new Date().getFullYear()) return '正しい年を入力してください'
  if (m < 1 || m > 12) return '月は1〜12で入力してください'
  if (d < 1 || d > 31) return '日は1〜31で入力してください'

  const birthDate = new Date(y, m - 1, d)
  // 存在しない日付チェック（例: 2月31日）
  if (birthDate.getMonth() !== m - 1) return '正しい日付を入力してください'

  const age = Math.floor(
    (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )
  if (age < 18) return '本サービスは18歳以上の方のみご利用いただけます'
  if (age > 120) return '正しい生年月日を入力してください'

  return null
}

export default function AgeVerifyPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleNext() {
    setError('')

    if (!checked) {
      setError('チェックボックスにチェックを入れてください')
      return
    }

    const validationError = validateAge(year, month, day)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const token = getAccessToken()
    if (token) {
      await fetch(`${API_BASE}/api/v1/auth/age-verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_year: Number(year), birth_month: Number(month), birth_day: Number(day) }),
      }).catch(() => {})
    }
    router.push('/consent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-[400px] px-6 flex flex-col items-center gap-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: '#fef3c7' }}
        >
          ⚠️
        </div>

        <div className="text-center">
          <div className="text-xl font-semibold mb-2">年齢確認</div>
          <div className="text-[13px] leading-[1.7]" style={{ color: '#9d9d99' }}>
            Yareは金銭の授受を伴うサービスです。<br />
            ご利用には<strong className="text-[#222]">18歳以上</strong>であることが必要です。
          </div>
        </div>

        <div className="w-full bg-white rounded-xl p-6" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3">生年月日を入力してください</div>

          <div className="flex gap-2 mb-4">
            {[
              { label: '年', value: year, setter: setYear, placeholder: '1990', flex: 2, min: 1900, max: 2010 },
              { label: '月', value: month, setter: setMonth, placeholder: '1', flex: 1, min: 1, max: 12 },
              { label: '日', value: day, setter: setDay, placeholder: '1', flex: 1, min: 1, max: 31 },
            ].map(({ label, value, setter, placeholder, flex, min, max }) => (
              <div key={label} style={{ flex }}>
                <div className="text-[10px] mb-1" style={{ color: '#9d9d99' }}>{label}</div>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => { setter(e.target.value); setError('') }}
                  placeholder={placeholder}
                  min={min}
                  max={max}
                  className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
                  style={{
                    border: `0.5px solid ${error ? '#ef4444' : '#e4e4e0'}`,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
            ))}
          </div>

          {/* エラー表示 */}
          {error && (
            <div
              className="flex items-start gap-2 p-2.5 rounded-lg mb-4"
              style={{ background: '#fee2e2' }}
            >
              <span className="text-red-500 text-sm flex-shrink-0">✕</span>
              <p className="text-[11px] leading-[1.5] m-0 text-red-700">{error}</p>
            </div>
          )}

          <div
            className="flex items-start gap-2 p-2.5 rounded-lg mb-4"
            style={{ background: '#fef3c7' }}
          >
            <span className="text-amber-500 text-sm flex-shrink-0">⚠</span>
            <p className="text-[11px] leading-[1.6] m-0" style={{ color: '#92400e' }}>
              虚偽申告は利用規約違反となります。18歳未満の方は本サービスをご利用いただけません。
            </p>
          </div>

          <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => { setChecked(e.target.checked); setError('') }}
              className="w-4 h-4"
              style={{ accentColor: '#4f46e5' }}
            />
            <span className="text-xs" style={{ color: '#666' }}>私は18歳以上であることを確認しました</span>
          </label>

          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: '#4f46e5',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '処理中...' : '確認して次へ →'}
          </button>
        </div>
      </div>
    </div>
  )
}
