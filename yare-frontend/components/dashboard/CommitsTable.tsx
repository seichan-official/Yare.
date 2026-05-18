import { cn } from '@/lib/utils'
import type { RawCommit } from '@/lib/types'

interface CommitsTableProps {
  commits: RawCommit[]
}

const statusConfig = {
  valid: { label: '● valid', cls: 'bg-green-50 text-green-700' },
  invalid: { label: '✕ invalid', cls: 'bg-red-50 text-red-700' },
  suspicious: { label: '◐ 審査中', cls: 'bg-amber-50 text-amber-800' },
} as const

export function CommitsTable({ commits }: CommitsTableProps) {
  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {['SHA', 'メッセージ', '日付', '結果'].map((h) => (
              <th
                key={h}
                className="text-left px-2.5 py-1.5 text-[10px] text-[#999] font-medium uppercase tracking-[0.03em] border-b border-black/[0.07]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {commits.slice(0, 8).map((c) => {
            const status = c.validation_status
            const cfg = status ? statusConfig[status] : null
            const date = new Date(c.committed_at)
            const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`

            return (
              <tr key={c.id} className="border-b border-black/[0.07] last:border-0 hover:bg-gray-50/50">
                <td className="px-2.5 py-2.5 font-mono text-[11px] text-[#666]">
                  {c.commit_sha.slice(0, 7)}
                </td>
                <td className="px-2.5 py-2.5 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {c.message}
                </td>
                <td className="px-2.5 py-2.5 text-[#666]">{dateStr}</td>
                <td className="px-2.5 py-2.5">
                  {cfg ? (
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', cfg.cls)}>
                      {cfg.label}
                    </span>
                  ) : (
                    <span className="text-[#999]">—</span>
                  )}
                </td>
              </tr>
            )
          })}
          {commits.length === 0 && (
            <tr>
              <td colSpan={4} className="px-2.5 py-6 text-center text-[#999]">
                コミットがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
