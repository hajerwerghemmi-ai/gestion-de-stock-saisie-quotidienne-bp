import { Boxes, Percent, Siren, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { roomById } from '@/lib/lab-data'
import { formatRate, rateTone, type ProductStat } from '@/lib/audit-data'
import { TONE_STYLES } from './loss-rate-bar'

export function AuditSummary({ stats, incidents }: { stats: ProductStat[]; incidents: number }) {
  const averageRate = stats.length ? stats.reduce((sum, s) => sum + s.rate, 0) / stats.length : 0
  const alerts = stats.filter((s) => s.rate > 3).length
  const worst = stats[0]?.losses ? stats[0] : null

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <Card icon={Percent} label="Taux de perte moyen" value={formatRate(averageRate)} valueClass={TONE_STYLES[rateTone(averageRate)].text} />
      <Card icon={TrendingDown} label="Incidents de perte" value={String(incidents)} valueClass={incidents ? 'text-red-700' : undefined} />
      <Card icon={Siren} label="Produits en alerte (> 3 %)" value={String(alerts)} valueClass={alerts ? 'text-red-700' : undefined} />
      <Card
        icon={Boxes}
        label="Produit le plus critique"
        value={worst ? worst.product.name : '—'}
        hint={worst?.worstRoom ? `Surtout en ${roomById(worst.worstRoom.roomId)?.name}` : undefined}
        small
      />
    </div>
  )
}

function Card({
  icon: Icon,
  label,
  value,
  hint,
  valueClass,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
  valueClass?: string
  small?: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-brand">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className={cn('truncate font-semibold tabular-nums text-brand', small ? 'text-sm leading-6' : 'text-xl', valueClass)}>{value}</p>
        {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
