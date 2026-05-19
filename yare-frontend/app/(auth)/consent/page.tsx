'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getAccessToken, getUser } from '@/lib/auth'
import type { TermsVersion } from '@/lib/types'

const FALLBACK_ITEMS = [
  { id: 1, label: '課金の仕組みについて理解した', body: 'チャレンジ未達成時に、事前に設定した金額が自動的に引き落とされることを理解しました。' },
  { id: 2, label: '設定可能な金額範囲について理解した', body: 'チャレンジ金額は最低500円から最高100,000円の範囲で自由に設定できます。' },
  { id: 3, label: '不正コミットの禁止について理解した', body: '実際の学習活動を伴わない空コミット・自動生成コードの使用は規約違反となります。' },
  { id: 4, label: '不正確定時の措置について理解した', body: '不正と判定された場合、予定損害賠償金の課金およびアカウント停止が行われます。' },
  { id: 5, label: 'リポジトリ情報の参照に同意した', body: 'コミット内容・差分情報をYareサービスが参照することに同意します。' },
  { id: 6, label: '個人情報の取り扱いに同意した', body: 'プライバシーポリシーに従い、個人情報が適切に取り扱われることに同意します。' },
  { id: 7, label: '返金不可ポリシーについて理解した', body: '一度課金された金額は、原則として返金されません。' },
  { id: 8, label: '規約変更時の通知方法について理解した', body: '規約変更時はメールおよびアプリ内通知で事前にお知らせします。' },
]

function todayYYYYMMDD() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function validateDate(val: string): boolean {
  if (!/^\d{8}$/.test(val)) return false
  const y = Number(val.slice(0, 4))
  const m = Number(val.slice(4, 6))
  const d = Number(val.slice(6, 8))
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false
  const today = new Date()
  return y === today.getFullYear() && m - 1 === today.getMonth() && d === today.getDate()
}

export default function ConsentPage() {
  const router = useRouter()
  const token = getAccessToken()
  const [terms, setTerms] = useState<TermsVersion | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [sigName, setSigName] = useState('')
  const [sigDate, setSigDate] = useState(todayYYYYMMDD())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)
  const termsRef = useRef<HTMLDivElement>(null)

  const items = terms?.checkpoint_items || FALLBACK_ITEMS
  const allChecked = items.every((i) => checked[i.id])
  const checkedCount = Object.values(checked).filter(Boolean).length

  // GitHubログイン名をデフォルト表示名として設定
  useEffect(() => {
    const u = getUser<{ github_login: string }>()
    if (u?.github_login) setSigName(u.github_login)
  }, [])

  useEffect(() => {
    if (!token) return
    api.getCurrentTerms(token).then((r) => setTerms(r.data)).catch(() => {})
  }, [token])

  // 電子署名として有効かどうか
  const sigNameTrimmed = sigName.trim()
  const sigDateValid = validateDate(sigDate)
  const sigValid = sigNameTrimmed.length > 0 && sigDateValid
  const canSubmit = allChecked && sigValid

  async function handleSubmit() {
    if (!canSubmit || !token) return
    setError('')

    if (!sigValid) {
      setError('署名の氏名と日付（YYYYMMDD）を正しく入力してください')
      return
    }

    setLoading(true)
    try {
      const states: Record<string, boolean> = {}
      items.forEach((i) => { states[String(i.id)] = true })
      await api.createAgreement(token, terms?.id || '', states)
      router.push('/setup-payment')
    } catch {
      // 同意は取れているのでページ遷移は進める
      router.push('/setup-payment')
    } finally {
      setLoading(false)
    }
  }

  function toggle(id: number) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8f8f7' }}>
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="h-14 bg-white flex items-center px-5 flex-shrink-0" style={{ borderBottom: '0.5px solid #e4e4e0' }}>
          <span className="text-[14px] font-medium">利用規約への同意</span>
        </div>

        <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '1fr 320px' }}>

          {/* Left: 規約テキスト + チェックリスト */}
          <div className="overflow-y-auto p-6" style={{ borderRight: '0.5px solid #e4e4e0' }}>

            {/* 規約全文 */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold">利用規約 v1.0.0</span>
                <a href="/terms" target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 hover:underline">別タブで開く →</a>
              </div>
              <div
                ref={termsRef}
                onScroll={(e) => {
                  const el = e.currentTarget
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
                    setTermsScrolled(true)
                  }
                }}
                className="text-[12px] leading-[1.9] whitespace-pre-wrap rounded-xl p-4 overflow-y-auto"
                style={{ background: '#fff', border: '0.5px solid #e4e4e0', color: '#444', height: '280px' }}
              >{`第1条（適用）
本規約は、Yare.（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。

第2条（サービス内容）
本サービスは、プログラミング学習の継続を支援するため、ユーザーが自ら設定した目標に対してコミット達成状況を記録し、未達成の場合に事前に登録したクレジットカードへ請求を行うサービスです。

第3条（登録・認証）
ユーザーはGitHubアカウントを用いて本サービスに登録します。18歳未満の方は本サービスを利用できません。虚偽の年齢を申告した場合、一切の責任はユーザーが負うものとします。

第4条（チャレンジと課金）
ユーザーは任意の金額・期間・リポジトリを設定してチャレンジを開始できます。期間中に設定したコミット条件を満たせなかった場合、ユーザーが設定した金額が登録済みのクレジットカードに請求されます。課金はStripeを通じて処理されます。

第5条（禁止事項）
①虚偽情報の登録、②不正な方法によるコミット操作、③他者への権利譲渡、④その他法令または公序良俗に反する行為を禁じます。

第6条（免責事項）
本サービスは現状提供であり、コミット判定・課金処理に関するいかなる保証も行いません。システム障害・外部サービス（GitHub・Stripe等）の不具合による損害について、当サービスは責任を負いません。

第7条（退会）
ユーザーはいつでも退会できます。ただし、進行中のチャレンジがある場合は退会できません。退会後もすでに確定した請求は有効です。

第8条（規約変更）
本規約は予告なく変更される場合があります。変更後も本サービスを継続利用した場合、変更後の規約に同意したものとみなします。

第9条（準拠法）
本規約は日本法に準拠し、東京地方裁判所を第一審の専属的合意管轄裁判所とします。`}
              </div>
            </div>

            {/* チェックリスト */}
            <div style={{ borderTop: '0.5px solid #e4e4e0', paddingTop: '16px', opacity: termsScrolled ? 1 : 0.4, pointerEvents: termsScrolled ? 'auto' : 'none' }}>
              {!termsScrolled && (
                <p className="text-[11px] mb-2 text-center" style={{ color: '#9d9d99' }}>↑ 規約を最後までスクロールするとチェックできます</p>
              )}
              <p className="text-[12px] mb-3 font-medium" style={{ color: '#555' }}>
                上記の規約を読んだ上で、以下の重要事項を<strong>1項目ずつ</strong>確認してください。
              </p>
              <div className="flex flex-col gap-2.5">
              {items.map((item) => {
                const isChecked = !!checked[item.id]
                return (
                  <div
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="flex gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: `1px solid ${isChecked ? '#4f46e5' : '#e4e4e0'}`,
                      background: isChecked ? '#e0e7ff' : '#fff',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                      style={{
                        border: `1.5px solid ${isChecked ? '#4f46e5' : '#e4e4e0'}`,
                        background: isChecked ? '#4f46e5' : '#fff',
                      }}
                    >
                      {isChecked && <span className="text-white text-[11px]">✓</span>}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium mb-1" style={{ color: isChecked ? '#4f46e5' : '#222' }}>
                        {item.id}. {item.label}
                      </div>
                      <div className="text-xs leading-[1.6]" style={{ color: '#9d9d99' }}>
                        {'body' in item ? (item as { body: string }).body : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            </div>
          </div>

          {/* Right: 同意状況 + 電子署名 + ボタン */}
          <div className="overflow-y-auto p-5 flex flex-col gap-3.5">

            {/* 進捗 */}
            <div className="text-[13px] font-medium">同意状況</div>
            <div className="flex flex-col gap-1">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ background: checked[i.id] ? '#dcfce7' : '#f0f0ee' }}
                >
                  <span className="text-xs" style={{ color: checked[i.id] ? '#15803d' : '#9d9d99' }}>
                    {checked[i.id] ? '✓' : '○'}
                  </span>
                  <span className="text-[11px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ color: checked[i.id] ? '#15803d' : '#9d9d99' }}>
                    {i.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-lg" style={{ background: '#f0f0ee' }}>
              <div className="text-[11px] mb-1" style={{ color: '#9d9d99' }}>進捗</div>
              <div className="text-base font-semibold">{checkedCount} / {items.length}</div>
              <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#e4e4e0' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ background: '#4f46e5', width: `${(checkedCount / items.length) * 100}%` }}
                />
              </div>
            </div>

            {/* 電子署名 */}
            <div
              className="p-4 rounded-xl flex flex-col gap-3"
              style={{
                border: `1px solid ${allChecked ? '#4f46e5' : '#e4e4e0'}`,
                background: allChecked ? '#f5f3ff' : '#fafafa',
                opacity: allChecked ? 1 : 0.5,
                pointerEvents: allChecked ? 'auto' : 'none',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-indigo-600 text-sm">✍</span>
                <span className="text-[13px] font-medium text-indigo-700">電子署名</span>
              </div>
              <p className="text-[11px] leading-[1.6]" style={{ color: '#6b7280' }}>
                以下に氏名（またはGitHubユーザー名）と本日の日付を入力して同意を確定してください。
              </p>

              <div>
                <div className="text-[10px] mb-1 font-medium uppercase tracking-[0.05em]" style={{ color: '#9d9d99' }}>氏名 / ユーザー名</div>
                <input
                  type="text"
                  value={sigName}
                  onChange={(e) => { setSigName(e.target.value); setError('') }}
                  placeholder="例: Taro Yamada"
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                  style={{ border: `0.5px solid ${sigNameTrimmed ? '#4f46e5' : '#e4e4e0'}`, fontFamily: 'inherit', background: '#fff' }}
                />
              </div>

              <div>
                <div className="text-[10px] mb-1 font-medium uppercase tracking-[0.05em]" style={{ color: '#9d9d99' }}>日付（YYYYMMDD）</div>
                <input
                  type="text"
                  value={sigDate}
                  onChange={(e) => { setSigDate(e.target.value); setError('') }}
                  placeholder="例: 20260518"
                  maxLength={8}
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none font-mono"
                  style={{ border: `0.5px solid ${sigDateValid ? '#4f46e5' : '#e4e4e0'}`, background: '#fff' }}
                />
                {sigDate.length > 0 && !sigDateValid && (
                  <p className="text-[10px] mt-1 text-red-500">YYYYMMDDの形式で入力してください</p>
                )}
              </div>

              {/* 署名プレビュー */}
              {sigValid && (
                <div className="px-3 py-2 rounded-lg" style={{ background: '#ede9fe', border: '1px solid #c4b5fd' }}>
                  <div className="text-[10px] mb-1" style={{ color: '#7c3aed' }}>署名プレビュー</div>
                  <div className="text-[12px] font-medium" style={{ color: '#4c1d95' }}>
                    {sigNameTrimmed} — {sigDate.slice(0, 4)}/{sigDate.slice(4, 6)}/{sigDate.slice(6, 8)}
                  </div>
                </div>
              )}
            </div>

            {/* エラー */}
            {error && (
              <p className="text-[11px] text-red-600">{error}</p>
            )}

            {/* 同意ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={{
                background: canSubmit ? '#4f46e5' : '#e4e4e0',
                color: canSubmit ? '#fff' : '#9d9d99',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? '処理中...' : '同意して次へ →'}
            </button>

            {!allChecked && (
              <p className="text-[11px] text-center" style={{ color: '#9d9d99' }}>
                すべての項目にチェックしてください
              </p>
            )}
            {allChecked && !sigValid && (
              <p className="text-[11px] text-center" style={{ color: '#9d9d99' }}>
                電子署名を入力してください
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
