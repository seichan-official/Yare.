'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Flame,
  GitCommit,
  Bell,
  CreditCard,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react'
import { clearTokens, getUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/challenges', label: 'チャレンジ', icon: Flame },
  { href: '/commits', label: 'コミット履歴', icon: GitCommit },
  { href: '/notifications', label: '通知', icon: Bell, badge: true },
]

const accountItems = [
  { href: '/settings/payment', label: '支払い設定', icon: CreditCard },
  { href: '/settings/terms', label: '規約・ログ', icon: FileText },
  { href: '/settings', label: '設定', icon: Settings },
]

interface NavItemProps {
  href: string
  label: string
  icon: React.ElementType
  badge?: boolean
  unreadCount?: number
}

function NavItem({ href, label, icon: Icon, badge, unreadCount }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg mx-2 text-[13px] transition-all duration-150',
        isActive
          ? 'bg-indigo-500/20 text-indigo-300'
          : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
      {badge && unreadCount && unreadCount > 0 ? (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  )
}

interface UserInfo {
  github_login: string
  email: string
  avatar_url?: string
}

export function Sidebar() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const u = getUser<UserInfo>()
    setUser(u)
  }, [])

  const initials = user?.github_login?.slice(0, 2).toUpperCase() || 'YU'

  function handleLogout() {
    clearTokens()
    router.push('/signin')
  }

  return (
    <aside className="w-[220px] bg-[#0f0f1a] flex flex-col flex-shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-[18px] pb-3.5 text-xl font-semibold text-white tracking-tight border-b border-white/[0.06]">
        Yare<span className="text-indigo-400">.</span>
      </div>

      {/* Nav */}
      <div className="pt-4">
        <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/30">
          メニュー
        </div>
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>

      <div className="pt-4">
        <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/30">
          アカウント
        </div>
        {accountItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg mx-2 text-[13px] text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-150 w-[calc(100%-16px)]"
        >
          <LogOut size={16} />
          <span>ログアウト</span>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto px-3 py-3.5 border-t border-white/[0.06] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-medium text-white/80 truncate">
            {user?.github_login || '---'}
          </div>
          <div className="text-[11px] text-white/35 truncate">
            {user?.email || '---'}
          </div>
        </div>
      </div>
    </aside>
  )
}
