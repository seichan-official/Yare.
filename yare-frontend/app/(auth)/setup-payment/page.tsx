'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK || '')

const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '13px',
      color: '#222',
      '::placeholder': { color: '#9d9d99' },
    },
  },
}

function CardForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const cardNumber = elements.getElement(CardNumberElement)
    if (!cardNumber) return

    const { error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardNumber },
    })

    if (stripeError) {
      setError(stripeError.message || '決済エラーが発生しました')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <div className="text-[11px] mb-1" style={{ color: '#9d9d99' }}>カード番号</div>
        <div className="w-full px-3 py-2.5 rounded-lg" style={{ border: '0.5px solid #e4e4e0' }}>
          <CardNumberElement options={STRIPE_ELEMENT_STYLE} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] mb-1" style={{ color: '#9d9d99' }}>有効期限</div>
          <div className="w-full px-3 py-2.5 rounded-lg" style={{ border: '0.5px solid #e4e4e0' }}>
            <CardExpiryElement options={STRIPE_ELEMENT_STYLE} />
          </div>
        </div>
        <div>
          <div className="text-[11px] mb-1" style={{ color: '#9d9d99' }}>CVC</div>
          <div className="w-full px-3 py-2.5 rounded-lg" style={{ border: '0.5px solid #e4e4e0' }}>
            <CardCvcElement options={STRIPE_ELEMENT_STYLE} />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: '#e0e7ff' }}>
        <span className="text-indigo-600 text-sm">🔒</span>
        <p className="text-[11px] leading-[1.5] m-0 text-indigo-700">
          カード情報はStripeが暗号化して管理します。Yareはカード番号を保持しません。
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {loading ? '登録中...' : 'カードを登録してチャレンジを始める →'}
      </button>
    </div>
  )
}

export default function SetupPaymentPage() {
  const token = getAccessToken()
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) { router.push('/signin'); return }
    api.createSetupIntent(token)
      .then((r) => setClientSecret(r.data.client_secret))
      .catch((e: unknown) => {
        // Echo の HTTPError は { message: "..." }、カスタムエラーは { error: { message: "..." } }
        if (e && typeof e === 'object') {
          if ('message' in e) {
            // 401 = トークン切れ → 再ログイン
            router.push('/signin')
            return
          }
          if ('error' in e) {
            setErrorMsg((e as { error: { message: string } }).error.message)
            return
          }
        }
        setErrorMsg('決済サービスへの接続に失敗しました')
      })
      .finally(() => setLoading(false))
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f7]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-[480px] px-6 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-xl font-semibold mb-1.5">カード情報を登録</div>
          <div className="text-[13px] leading-[1.6]" style={{ color: '#9d9d99' }}>
            チャレンジ未達成時の自動課金のために必要です。<br />カード情報はStripeが安全に管理します。
          </div>
        </div>

        {/* Card visual */}
        <div
          className="w-full h-[160px] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }}
        >
          <div className="absolute top-[-30px] right-[-30px] w-[120px] h-[120px] rounded-full" style={{ background: 'rgba(99,102,241,0.2)' }} />
          <div className="absolute bottom-[-20px] right-[40px] w-[80px] h-[80px] rounded-full" style={{ background: 'rgba(139,92,246,0.15)' }} />
          <div className="flex justify-between items-start z-10 relative">
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>クレジットカード</div>
            <div className="text-2xl text-white">≋≋</div>
          </div>
          <div className="z-10 relative">
            <div className="font-mono text-base text-white tracking-[0.2em] mb-3">●●●● ●●●● ●●●● ●●●●</div>
            <div className="flex gap-6">
              <div>
                <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>カード保有者</div>
                <div className="text-xs text-white mt-0.5">YOUR NAME</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>有効期限</div>
                <div className="text-xs text-white mt-0.5">MM / YY</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e4e4e0' }}>
          {loading ? (
            <div className="text-center text-sm py-4" style={{ color: '#9d9d99' }}>読み込み中...</div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CardForm clientSecret={clientSecret} />
            </Elements>
          ) : (
            <div className="text-center text-sm py-4 text-red-600">
              決済情報の読み込みに失敗しました。
              {errorMsg && <p className="text-xs mt-1 text-red-400">{errorMsg}</p>}
              <button onClick={() => router.push('/dashboard')} className="block mx-auto mt-2 text-indigo-600 hover:underline text-xs">
                スキップしてダッシュボードへ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
