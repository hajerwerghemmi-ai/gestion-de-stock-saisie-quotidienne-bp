'use client'

import { useMemo, useState } from 'react'
import { CircleCheck, Link2, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { personById, roomById } from '@/lib/lab-data'
import {
  formatNumber,
  formatPeriod,
  formatQty,
  formatRate,
  formatShortDate,
  groupBoxes,
  rateTone,
  type AuditRecord,
  type ProductStat,
} from '@/lib/audit-data'
import { TONE_STYLES } from './loss-rate-bar'

export type AuditTarget = {
  roomId: string
  productId: string
  dateKey: string
  periodFrom: string
  periodTo: string
}

type Props = {
  stat: ProductStat
  records: AuditRecord[]
  onOpenAudit: (target: AuditTarget) => void
}

export function ProductDrilldown({ stat, records, onOpenAudit }: Props) {
  const [selectedRoom, setSelectedRoom] = useState(() => stat.worstRoom?.roomId ?? stat.rooms[0]?.roomId)
  const roomId = stat.rooms.some((r) => r.roomId === selectedRoom) ? selectedRoom : stat.rooms[0]?.roomId

  const boxes = useMemo(
    () => groupBoxes(records.filter((r) => r.productId === stat.product.id && r.roomId === roomId)),
    [records, stat.product.id, roomId],
  )

  const unit = stat.product.unit

  return (
    <div className="grid gap-4 rounded-lg bg-slate-100/80 p-4 md:grid-cols-[240px_1fr]">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Salles consommatrices</p>
        <div role="radiogroup" aria-label={`Salles ayant consommé ${stat.product.name}`} className="flex flex-col gap-1.5">
          {stat.rooms.map((room) => {
            const tone = TONE_STYLES[rateTone(room.rate)]
            const active = room.roomId === roomId
            return (
              <button
                key={room.roomId}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedRoom(room.roomId)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                  active ? 'bg-white text-brand shadow-sm ring-1 ring-brand/20' : 'text-slate-600 hover:bg-white/70',
                )}
              >
                <span className={cn('size-2.5 shrink-0 rounded-sm', tone.dot)} aria-hidden="true" />
                <span className="flex-1 truncate font-medium">{roomById(room.roomId)?.name}</span>
                <span className={cn('text-xs font-semibold tabular-nums', tone.text)}>
                  <span className="sr-only">Taux de perte </span>
                  {formatRate(room.rate)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-white p-4 ring-1 ring-black/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-brand">Historique des lots — {roomById(roomId ?? '')?.name}</p>
          <p className="text-xs text-muted-foreground">
            {boxes.length} boîte{boxes.length > 1 ? 's' : ''} sur la période
          </p>
        </div>

        {boxes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune consommation sur la période.</p>
        ) : (
          <ol className="relative flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
            {boxes.map((box) => {
              const healthy = box.losses === 0
              return (
                <li
                  key={box.boxId}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border-l-[3px] px-3 py-2.5',
                    healthy ? 'border-slate-200 bg-slate-50/60' : 'border-red-500 bg-red-50/50',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {healthy ? (
                      <CircleCheck className="size-4 shrink-0 text-emerald-600/70" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="size-4 shrink-0 text-red-600" aria-hidden="true" />
                    )}
                    <span className={cn('text-sm font-medium', healthy ? 'text-slate-500' : 'text-slate-800')}>
                      Lot {box.lot} <span className="text-slate-400">· Boîte n°{box.boxNo}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatShortDate(box.firstDateKey)} → {formatShortDate(box.lastDateKey)} · {formatNumber(box.consumption)} {unit}
                    </span>
                    <span className={cn('ml-auto text-xs font-medium', healthy ? 'text-slate-400' : 'text-red-700')}>
                      {healthy ? 'Aucune perte' : `${formatQty(box.losses, unit)} perdu${box.losses > 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {box.incidents.length > 0 && (
                    <ul className="flex flex-col gap-2 pl-6">
                      {box.incidents.map((incident) => {
                        const periodFrom = incident.previousDateKey ?? incident.dateKey
                        return (
                          <li key={incident.id} className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-red-700">
                              Perte de {formatQty(incident.ecart, unit)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Détectée le {formatShortDate(incident.dateKey)} par {personById(incident.personId)?.name}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                onOpenAudit({
                                  roomId: incident.roomId,
                                  productId: incident.productId,
                                  dateKey: incident.dateKey,
                                  periodFrom,
                                  periodTo: incident.dateKey,
                                })
                              }
                              className="flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            >
                              <Link2 className="size-3.5" aria-hidden="true" />
                              Période du problème : {formatPeriod(periodFrom, incident.dateKey)}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
