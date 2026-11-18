'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, History, Inbox, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { personById, productById, roomById } from '@/lib/lab-data'
import { formatLongDate, formatNumber, formatPeriod, formatQty, shiftDateKey, type AuditRecord } from '@/lib/audit-data'
import type { AuditTarget } from './product-drilldown'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: AuditTarget | null
  history: AuditRecord[]
  minDate: string
  maxDate: string
}

export function AuditSheet({ open, onOpenChange, target, ...rest }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 bg-[#F7FAFA] p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-4xl"
      >
        {target && <AuditSheetBody key={`${target.roomId}-${target.dateKey}-${target.productId}`} target={target} {...rest} />}
      </SheetContent>
    </Sheet>
  )
}

const HEADERS = ['Produit', 'Lot', 'Qté consommée', 'Reste attendu', 'Reste déclaré', 'Écart', 'Personne']

function AuditSheetBody({ target, history, minDate, maxDate }: Omit<Props, 'open' | 'onOpenChange' | 'target'> & { target: AuditTarget }) {
  const [dateKey, setDateKey] = useState(target.dateKey)
  const room = roomById(target.roomId)
  const lines = history.filter((r) => r.roomId === target.roomId && r.dateKey === dateKey)
  const inPeriod = dateKey >= target.periodFrom && dateKey <= target.periodTo
  const totalEcart = lines.reduce((sum, l) => sum + (l.ecart > 0 ? 1 : 0), 0)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
            <History className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <SheetTitle className="text-lg font-semibold text-brand">Audit — Salle {room?.name}</SheetTitle>
            <SheetDescription className="text-xs">
              Reconstitution de la feuille de saisie, à des fins de contrôle.
            </SheetDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:flex">
            <Eye className="size-3.5" aria-hidden="true" />
            Lecture seule
          </span>
          <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Fermer" />}>
            <X aria-hidden="true" />
          </SheetClose>
        </div>
      </header>

      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-200">
          <span className="font-semibold">Période du problème :</span>
          <span>{formatPeriod(target.periodFrom, target.periodTo)}</span>
          <span className="text-red-700/70">· {productById(target.productId)?.name}</span>
        </div>

        <nav aria-label="Navigation par jour" className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateKey((k) => shiftDateKey(k, -1))}
            disabled={dateKey <= minDate}
          >
            <ChevronLeft aria-hidden="true" />
            Jour précédent
          </Button>
          <div className="flex min-w-0 flex-col items-center text-center" aria-live="polite">
            <p className="truncate text-sm font-semibold capitalize text-brand">{formatLongDate(dateKey)}</p>
            {inPeriod && <p className="text-[11px] font-medium text-red-600">Dans la période du problème</p>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateKey((k) => shiftDateKey(k, 1))}
            disabled={dateKey >= maxDate}
          >
            Jour suivant
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-16 text-center ring-1 ring-black/5">
            <div className="flex size-12 items-center justify-center rounded-full bg-canvas text-brand">
              <Inbox className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">Aucune consommation enregistrée pour cette salle à cette date.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
              <table className="w-full min-w-[680px] text-sm">
                <caption className="sr-only">
                  Feuille de saisie de la salle {room?.name} du {formatLongDate(dateKey)}
                </caption>
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {HEADERS.map((h) => (
                      <th key={h} scope="col" className="px-3 py-2.5 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const product = productById(line.productId)
                    const hasLoss = line.ecart > 0
                    const focused = line.productId === target.productId
                    return (
                      <tr
                        key={line.id}
                        className={cn('border-t border-slate-100', hasLoss && 'bg-red-50/80')}
                      >
                        <th scope="row" className="px-3 py-2.5 text-left font-normal">
                          <span className={cn('flex items-center gap-2', focused ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                            {focused && <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />}
                            {product?.name}
                            {focused && <span className="sr-only">(produit audité)</span>}
                          </span>
                        </th>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{line.lot}</td>
                        <td className="px-3 py-2.5 tabular-nums text-slate-700">{formatNumber(line.qty)}</td>
                        <td className="px-3 py-2.5 tabular-nums text-slate-700">{formatNumber(line.expected)}</td>
                        <td className={cn('px-3 py-2.5 tabular-nums', hasLoss ? 'font-semibold text-red-700' : 'text-slate-700')}>
                          {formatNumber(line.declared)}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {hasLoss ? (
                            <span className="inline-flex rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                              −{formatQty(line.ecart, product?.unit ?? '')}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{personById(line.personId)?.name}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Reste attendu = reste déclaré à la saisie précédente − quantité consommée.{' '}
              {totalEcart > 0
                ? `${totalEcart} ligne${totalEcart > 1 ? 's' : ''} présente${totalEcart > 1 ? 'nt' : ''} un écart ce jour.`
                : 'Aucun écart ce jour.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
