'use client'

import { Fragment, useState } from 'react'
import { ChevronRight, PackageSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { roomById } from '@/lib/lab-data'
import { formatNumber, formatRate, rateTone, type AuditRecord, type ConfirmedLoss, type ProductStat } from '@/lib/audit-data'
import { LossRateBar, TONE_STYLES } from './loss-rate-bar'
import { ProductDrilldown, type AuditTarget } from './product-drilldown'

type Props = {
  stats: ProductStat[]
  records: AuditRecord[]
  confirmed: ConfirmedLoss[]
  onOpenAudit: (target: AuditTarget) => void
}

const COLUMNS = ['Produit', 'Consommation totale', 'Pertes confirmées', 'Taux de perte', 'Pire salle']

export function LossTable({ stats, records, confirmed, onOpenAudit }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
        <div className="flex size-12 items-center justify-center rounded-full bg-canvas text-brand">
          <PackageSearch className="size-5" aria-hidden="true" />
        </div>
        <p className="font-semibold text-brand">Aucune donnée pour ces filtres</p>
        <p className="max-w-sm text-sm text-muted-foreground">Élargissez la période ou modifiez la catégorie et la salle.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-brand">Analyse par produit</h2>
        <p className="text-xs text-muted-foreground">Cliquez sur un produit pour le détail par salle</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              {COLUMNS.map((col) => (
                <th key={col} scope="col" className="px-4 py-2.5 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => {
              const isOpen = expanded === stat.product.id
              const panelId = `drilldown-${stat.product.id}`
              return (
                <Fragment key={stat.product.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : stat.product.id)}
                    className={cn(
                      'cursor-pointer border-t border-slate-100 transition-colors',
                      isOpen ? 'bg-canvas/60' : 'hover:bg-slate-50',
                    )}
                  >
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpanded(isOpen ? null : stat.product.id)
                        }}
                        className="flex items-center gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <ChevronRight
                          className={cn('size-4 shrink-0 text-slate-400 transition-transform duration-200', isOpen && 'rotate-90 text-brand')}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-slate-800">{stat.product.name}</span>
                      </button>
                    </th>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {formatNumber(stat.consumption)} <span className="text-slate-400">{stat.product.unit}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={cn('font-medium', stat.losses > 0 ? 'text-red-700' : 'text-slate-400')}>
                        {formatNumber(stat.losses)}
                      </span>{' '}
                      <span className="text-slate-400">{stat.product.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <LossRateBar rate={stat.rate} />
                    </td>
                    <td className="px-4 py-3">
                      {stat.worstRoom ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                            TONE_STYLES[rateTone(stat.worstRoom.rate)].soft,
                          )}
                        >
                          {roomById(stat.worstRoom.roomId)?.name}
                          <span className="font-semibold tabular-nums">{formatRate(stat.worstRoom.rate)}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Aucune perte</span>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr id={panelId}>
                      <td colSpan={COLUMNS.length} className="px-4 pb-4 pt-1">
                        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
                          <ProductDrilldown stat={stat} records={records} confirmed={confirmed} onOpenAudit={onOpenAudit} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
