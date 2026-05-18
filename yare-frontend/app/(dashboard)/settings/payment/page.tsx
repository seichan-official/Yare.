'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function PaymentSettingsPage() {
  const router = useRouter()
  // TODO: 実際のカード情報はStripe APIから取得
  const [hasCard] = useState(false)

  return (
    <>
      <Topbar title="支払い設定" showNewChallenge={false} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 max-w-2xl">

        {/* 登録済みカード */}
        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} className="text-indigo-600" />
            <span className="text-[13px] font-medium">登録済みカード</span>
          </div>

          {hasCard ? (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ border: '0.5px solid #e4e4e0' }}>
              <div className="w-9 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#0f0f1a' }}>VISA</div>
              <div>
                <div className="text-[13px] font-medium">•••• •••• •••• 4242</div>
                <div className="text-[11px]" style={{ color: '#9d9d99' }}>有効期限 12/27</div>
              </div>
              <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">有効</span>
              <button className="px-2.5 py-1 rounded-lg text-[11px] border hover:bg-red-50 hover:text-red-600 transition-colors" style={{ border: '0.5px solid #e4e4e0', color: '#666' }}>
                削除
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: '#fef3c7' }}>
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[13px] font-medium" style={{ color: '#92400e' }}>カードが未登録です</div>
                <div className="text-[12px] mt-0.5 leading-[1.6]" style={{ color: '#92400e' }}>
                  チャレンジを作成するにはカード情報の登録が必要です。
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/setup-payment')}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {hasCard ? '+ 新しいカードを追加' : 'カードを登録する'}
          </button>
        </div>

        {/* セキュリティ説明 */}
        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={15} className="text-green-600" />
            <span className="text-[13px] font-medium">セキュリティについて</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              'カード情報はStripeが暗号化して管理します。Yareはカード番号を保持しません。',
              '課金は未達成時のみ発生します。チャレンジを達成した場合、引き落としは一切ありません。',
              '課金が発生する48時間前にメールで予告通知が届きます。',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] leading-[1.6]" style={{ color: '#666' }}>
                <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* 支払い履歴 */}
        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
          <div className="text-[13px] font-medium mb-3">支払い履歴</div>
          <div className="text-center py-6 text-sm" style={{ color: '#9d9d99' }}>
            支払い履歴はありません
          </div>
        </div>

      </div>
    </>
  )
}
