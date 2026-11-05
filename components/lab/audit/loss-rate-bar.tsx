import { cn } from '@/lib/utils'
import { formatRate, rateTone, type RateTone } from '@/lib/audit-data'

const BAR_SCALE_MAX = 6

export const TONE_STYLES: Record<RateTone, { bar: string; text: string; soft: string; dot: string }> = {
  good: { bar: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  warn: { bar: 'bg-amber-400', text: 'text-amber-700', soft: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-400' },
  bad: { bar: 'bg-red-500', text: 'text-red-700', soft: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
}

export function LossRateBar({ rate, className }: { rate: number; className?: string }) {
  const tone = TONE_STYLES[rateTone(rate)]
  const width = Math.min(rate / BAR_SCALE_MAX, 1) * 100

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 w-16 shrink-0 lg:w-24 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className={cn('h-full rounded-full transition-[width] duration-500', tone.bar)} style={{ width: `${Math.max(width, rate > 0 ? 4 : 0)}%` }} />
      </div>
      <span className={cn('whitespace-nowrap text-sm font-semibold tabular-nums', tone.text)}>{formatRate(rate)}</span>
    </div>
  )
}
