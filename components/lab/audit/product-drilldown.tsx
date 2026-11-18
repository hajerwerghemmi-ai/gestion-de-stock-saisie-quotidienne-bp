'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Link2, PackageX, TrendingDown } from 'lucide-react'
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
  type BoxHistory,
  type ConfirmedLoss,
  type LossEvent,
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
  confirmed: ConfirmedLoss[]
  onOpenAudit: (target: AuditTarget) => void
}

export function ProductDrilldown({ stat, records, confirmed, onOpenAudit }: Props) {
  const [selectedRoom, setSelectedRoom] = useState(() => stat.worstRoom?.roomId ?? stat.rooms[0]?.roomId)
  const roomId = stat.rooms.some((r) => r.roomId === selectedRoom) ? selectedRoom : stat.rooms[0]?.roomId
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const boxes = useMemo(
    () =>
      groupBoxes(
        records.filter((r) => r.productId === stat.product.id && r.roomId === roomId),
        confirmed.filter((l) => l.productId === stat.product.id && l.roomId === roomId),
      ),
    [records, confirmed, stat.product.id, roomId],
  )

  const unit = stat.product.unit
  const lossBoxes = boxes.filter((b) => b.losses > 0).length

  const toggle = (boxId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(boxId)) next.delete(boxId)
      else next.add(boxId)
      return next
    })

  return (
    <div className="grid gap-4 rounded-lg bg-slate-100/80 p-4 md:grid-cols-[260px_1fr]">
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
                  'flex flex-col gap-1 rounded-lg px-3 py-2.5 text-left text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                  active ? 'bg-white text-brand shadow-sm ring-1 ring-brand/20' : 'text-slate-600 hover:bg-white/70',
                )}
              >
                <span className="flex w-full items-center gap-2.5">
                  <span className={cn('size-2.5 shrink-0 rounded-sm', tone.dot)} aria-hidden="true" />
                  <span className="flex-1 truncate font-medium">{roomById(room.roomId)?.name}</span>
                  <span className={cn('text-xs font-semibold tabular-nums', tone.text)}>
                    <span className="sr-only">Taux de perte </span>
                    {formatRate(room.rate)}
                  </span>
                </span>
                <span className="flex w-full items-center justify-between gap-2 pl-5 text-xs text-slate-500">
                  <span>
                    Conso. <span className="font-medium tabular-nums text-slate-700">{formatQty(room.consumption, unit)}</span>
                  </span>
                  <span>
                    Perte{' '}
                    <span className={cn('font-medium tabular-nums', room.losses > 0 ? 'text-red-700' : 'text-slate-700')}>
                      {formatQty(room.losses, unit)}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-white p-4 ring-1 ring-black/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-brand">Chronologie des lots — {roomById(roomId ?? '')?.name}</p>
          <p className="text-xs text-muted-foreground">
            {boxes.length} boîte{boxes.length > 1 ? 's' : ''} · {lossBoxes} avec pertes
          </p>
        </div>

        {boxes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune consommation sur la période.</p>
        ) : (
          <ol className="relative flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
            {boxes.map((box, index) => (
              <TimelineItem
                key={box.boxId}
                box={box}
                unit={unit}
                last={index === boxes.length - 1}
                open={expanded.has(box.boxId)}
                onToggle={() => toggle(box.boxId)}
                onOpenAudit={onOpenAudit}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

type ItemProps = {
  box: BoxHistory
  unit: string
  last: boolean
  open: boolean
  onToggle: () => void
  onOpenAudit: (target: AuditTarget) => void
}

function TimelineItem({ box, unit, last, open, onToggle, onOpenAudit }: ItemProps) {
  const healthy = box.losses === 0
  const panelId = `timeline-${box.boxId}`
  const label = (
    <>
      Lot {box.lot}
      {box.boxNo !== null && <span className="font-normal text-slate-400"> · Boîte n°{box.boxNo}</span>}
    </>
  )
  const period = `${formatShortDate(box.firstDateKey)} → ${formatShortDate(box.lastDateKey)}${box.consumption ? ` · ${formatNumber(box.consumption)} ${unit}` : ''}`

  return (
    <li className="relative flex gap-3">
      <div className="relative flex w-6 shrink-0 justify-center">
        {!last && <span className="absolute top-6 -bottom-2 w-px bg-slate-200" aria-hidden="true" />}
        <span
          className={cn(
            'relative mt-2 flex size-6 items-center justify-center rounded-full ring-4 ring-white',
            healthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-600 text-white',
          )}
        >
          {healthy ? <Check className="size-3.5" aria-hidden="true" /> : <TrendingDown className="size-3.5" aria-hidden="true" />}
        </span>
      </div>

      {healthy ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm font-medium text-slate-500">{label}</span>
          <span className="text-xs text-slate-400">{period}</span>
          <span className="ml-auto text-xs text-slate-400">Aucune perte</span>
        </div>
      ) : (
        <div className={cn('min-w-0 flex-1 overflow-hidden rounded-lg ring-1 transition-colors', open ? 'bg-red-50/70 ring-red-200' : 'bg-red-50 ring-red-100')}>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
            className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left transition-colors hover:bg-red-100/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
          >
            <span className="text-sm font-semibold text-red-900">{label}</span>
            <span className="text-xs text-red-800/60">{period}</span>
            <span className="ml-auto flex items-center gap-2 text-xs font-semibold text-red-700">
              {formatQty(box.losses, unit)} perdu{box.losses > 1 ? 's' : ''}
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-medium tabular-nums">
                {box.events.length} événement{box.events.length > 1 ? 's' : ''}
              </span>
              <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
            </span>
          </button>
          <div
            id={panelId}
            inert={!open}
            className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
          >
            <div className="overflow-hidden">
              <ul className="flex flex-col gap-2 border-t border-red-100 px-3 py-3">
                {box.events.map((event) => (
                  <EventRow key={event.id} event={event} unit={unit} onOpenAudit={onOpenAudit} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

function EventRow({ event, unit, onOpenAudit }: { event: LossEvent; unit: string; onOpenAudit: (target: AuditTarget) => void }) {
  if (event.kind === 'unfound') {
    return (
      <li className="flex flex-col gap-1.5 rounded-md bg-white px-3 py-2.5 ring-1 ring-orange-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
            <PackageX className="size-3" aria-hidden="true" />
            Boîte non retrouvée
          </span>
          <span className="text-sm font-semibold text-red-700">{formatQty(event.qty, unit)}</span>
        </div>
        <p className="text-xs text-slate-500">
          Reste de la boîte jamais retrouvé · perte provisoire confirmée le {formatShortDate(event.dateKey)}
        </p>
      </li>
    )
  }

  const { record } = event
  const periodFrom = record.previousDateKey ?? record.dateKey
  return (
    <li className="flex flex-col gap-1.5 rounded-md bg-white px-3 py-2.5 ring-1 ring-red-100">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">Écart de saisie</span>
        <span className="text-sm font-semibold text-red-700">{formatQty(event.qty, unit)}</span>
      </div>
      <p className="text-xs text-slate-500">
        Détectée le {formatShortDate(record.dateKey)} par {personById(record.personId)?.name}
      </p>
      <button
        type="button"
        onClick={() =>
          onOpenAudit({
            roomId: record.roomId,
            productId: record.productId,
            dateKey: record.dateKey,
            periodFrom,
            periodTo: record.dateKey,
          })
        }
        className="flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Link2 className="size-3.5" aria-hidden="true" />
        Période du problème : {formatPeriod(periodFrom, record.dateKey)}
      </button>
    </li>
  )
}
