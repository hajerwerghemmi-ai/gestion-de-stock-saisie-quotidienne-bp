import { Archive, Clock3, PackageOpen, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { productById } from '@/lib/lab-data'
import { boxLossRate, HIGH_LOSS_THRESHOLD, isHighLoss, isProvisional, type LabBox } from '@/lib/lab-boxes'
import { formatQty, formatRate } from '@/lib/audit-data'

type Props = {
  box: LabBox
  highlighted?: boolean
  onManage?: () => void
}

export function BoxCard({ box, highlighted, onManage }: Props) {
  const product = productById(box.productId)
  if (!product) return null

  if (box.status === 'stockee') {
    return (
      <article id={`box-${box.id}`} className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-200">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-200/70 text-slate-500">
          <Archive className="size-3.5" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-sm font-medium text-slate-600">{product.name}</h3>
          <p className="font-mono text-[11px] text-muted-foreground">Lot {box.lot}</p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-slate-500">
          {product.capacity} {product.unit}
        </span>
      </article>
    )
  }

  const provisional = isProvisional(box)
  const high = isHighLoss(box)
  const percent = Math.round((box.remaining / product.capacity) * 100)
  const low = percent <= 20

  return (
    <article
      id={`box-${box.id}`}
      tabIndex={-1}
      className={cn(
        'rounded-lg border-l-4 bg-white p-3 shadow-sm ring-1 transition-shadow outline-none hover:shadow-md',
        provisional ? 'border-orange-500 ring-orange-200' : high ? 'border-red-800 ring-red-200' : 'border-brand/60 ring-black/5',
        highlighted && 'box-flash',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-md',
            provisional ? 'bg-orange-100 text-orange-700' : high ? 'bg-red-100 text-red-800' : 'bg-canvas text-brand',
          )}
        >
          <PackageOpen className="size-4" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-pretty text-sm font-semibold text-brand">{product.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">Lot {box.lot}</p>
        </div>
      </div>

      {(provisional || high) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {provisional && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800 ring-1 ring-orange-300">
              Perte provisoire
            </span>
          )}
          {high && (
            <span className="rounded-full bg-red-800 px-2 py-0.5 text-[11px] font-semibold text-white">
              {`Perte élevée > ${HIGH_LOSS_THRESHOLD} %`}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">Reste</span>
          <span className={cn('font-semibold tabular-nums', low ? 'text-amber-700' : 'text-brand')}>
            {box.remaining} / {product.capacity} <span className="font-normal text-muted-foreground">{product.unit}</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Reste ${box.remaining} sur ${product.capacity} ${product.unit}`}
          aria-valuenow={box.remaining}
          aria-valuemin={0}
          aria-valuemax={product.capacity}
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={cn('h-full rounded-full transition-all', low ? 'bg-amber-500' : 'bg-brand')}
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>
      </div>

      {provisional && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-orange-100 pt-2.5">
          <p className="flex items-center gap-1.5 text-xs text-orange-800">
            <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
            Remplacée il y a {box.provisional?.daysAgo} j
          </p>
          {onManage && (
            <button
              type="button"
              onClick={onManage}
              className="rounded-md text-xs font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Traiter
            </button>
          )}
        </div>
      )}

      {high && !provisional && (
        <p className="mt-3 flex items-center gap-1.5 border-t border-red-100 pt-2.5 text-xs text-red-800">
          <TrendingDown className="size-3.5 shrink-0" aria-hidden="true" />
          {formatQty(box.losses ?? 0, product.unit)} perdus · {formatRate(boxLossRate(box))}
        </p>
      )}
    </article>
  )
}
