'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import type { TermsVersion } from '@/lib/types'
import { FileText, ShieldCheck, ExternalLink } from 'lucide-react'

export default function TermsPage() {
  const token = getAccessToken()
  const [terms, setTerms] = useState<TermsVersion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.getCurrentTerms(token)
      .then((r) => setTerms(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  return (
    <>
      <Topbar title="規約・ログ" showNewChallenge={false} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 max-w-2xl">

        {/* 同意状況 */}
        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={15} className="text-green-600" />
            <span className="text-[13px] font-medium">同意状況</span>
          </div>
          {loading ? (
            <div className="text-sm py-2" style={{ color: '#9d9d99' }}>読み込み中...</div>
          ) : terms ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: '#666' }}>規約バージョン</span>
                <span className="font-medium font-mono">v{terms.version}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: '#666' }}>公開日</span>
                <span className="font-medium">
                  {new Date(terms.published_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: '#666' }}>同意状態</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
                  ✓ 同意済み
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: '#666' }}>署名方式</span>
                <span className="font-medium font-mono text-[11px]">SHA-256 ハッシュチェーン</span>
              </div>
            </div>
          ) : (
            <div className="text-sm py-2 text-red-600">規約情報の取得に失敗しました</div>
          )}
        </div>

        {/* 同意項目 */}
        {terms && terms.checkpoint_items?.length > 0 && (
          <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
            <div className="text-[13px] font-medium mb-3">同意した項目</div>
            <div className="flex flex-col gap-2">
              {terms.checkpoint_items.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 py-2" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                  <span className="text-green-500 flex-shrink-0 text-sm">✓</span>
                  <span className="text-[13px]" style={{ color: '#444' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 規約本文 */}
        {terms && (
          <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-indigo-600" />
              <span className="text-[13px] font-medium">利用規約本文</span>
            </div>
            <div
              className="text-[12px] leading-[1.9] whitespace-pre-wrap overflow-y-auto max-h-80 p-3 rounded-lg"
              style={{ background: '#f8f8f7', color: '#555', border: '0.5px solid #e4e4e0' }}
            >
              {terms.content}
            </div>
          </div>
        )}

        {/* 法的表記リンク */}
        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3">法的情報</div>
          <div className="flex flex-col gap-2">
            {[
              { label: '特定商取引法に基づく表記', href: '/legal/commercial' },
              { label: 'プライバシーポリシー', href: '/privacy' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-2 text-[13px] text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <ExternalLink size={12} />
                {label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
