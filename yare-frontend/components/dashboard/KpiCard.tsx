interface KpiCardProps {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  icon: React.ReactNode
  iconBg: string
}

export function KpiCard({ label, value, sub, icon, iconBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.07] p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-[#999] uppercase tracking-[0.03em]">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <div className="text-[22px] font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] text-[#999] flex items-center gap-1">{sub}</div>
    </div>
  )
}
