interface AchievementRingProps {
  achievedDays: number
  requiredDays: number
  currentStreak: number
  bestStreak: number
  totalPaid: number
  completedChallenges: number
}

export function AchievementRing({
  achievedDays,
  requiredDays,
  currentStreak,
  bestStreak,
  totalPaid,
  completedChallenges,
}: AchievementRingProps) {
  const pct = requiredDays > 0 ? Math.min((achievedDays / requiredDays) * 100, 100) : 0
  const r = 44
  const circ = 2 * Math.PI * r
  const dashOffset = circ * (1 - pct / 100)

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 h-full">
      <div className="text-[13px] font-medium self-start">達成率</div>

      {/* Ring */}
      <div className="relative w-[110px] h-[110px]">
        <svg
          className="w-[110px] h-[110px] -rotate-90"
          viewBox="0 0 110 110"
        >
          <circle cx="55" cy="55" r={r} fill="none" stroke="#f0f0ee" strokeWidth="10" />
          <circle
            cx="55" cy="55" r={r}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold leading-none">
            {Math.round(pct)}<small className="text-[13px]">%</small>
          </span>
          <span className="text-[11px] text-[#999] mt-0.5">達成</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {[
          { val: currentStreak, label: '現在連続', color: 'text-indigo-600' },
          { val: bestStreak, label: '最長記録' },
          { val: `¥${totalPaid.toLocaleString()}`, label: '支払済み', color: 'text-green-600' },
          { val: completedChallenges, label: '完了チャレンジ' },
        ].map(({ val, label, color }) => (
          <div key={label} className="text-center bg-[#f8f8f8] rounded-lg p-2">
            <div className={`text-base font-semibold ${color || ''}`}>{val}</div>
            <div className="text-[10px] text-[#999]">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
