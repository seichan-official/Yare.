'use client'

interface WeeklyBarChartProps {
  data: number[]
  labels?: string[]
}

const DEFAULT_LABELS = ['月', '火', '水', '木', '金', '土', '日']

export function WeeklyBarChart({ data, labels = DEFAULT_LABELS }: WeeklyBarChartProps) {
  const maxVal = Math.max(...data, 1)
  const todayIdx = data.length - 1

  return (
    <div>
      <div className="flex items-end gap-1 h-[60px]">
        {data.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className={`w-full rounded-t-[3px] transition-all ${i === todayIdx ? 'bg-indigo-600' : 'bg-indigo-200'}`}
              style={{ height: `${Math.round((v / maxVal) * 56)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {labels.slice(0, data.length).map((l, i) => (
          <span
            key={i}
            className={`text-[9px] flex-1 text-center ${i === todayIdx ? 'text-indigo-600 font-medium' : 'text-[#999]'}`}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        {data.map((v, i) => (
          <span key={i} className="text-[9px] flex-1 text-center text-[#999]">{v}</span>
        ))}
      </div>
    </div>
  )
}
