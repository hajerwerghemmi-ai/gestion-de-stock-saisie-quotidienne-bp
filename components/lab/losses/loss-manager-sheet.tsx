'use client'

import { useMemo, useState } from 'react'
import { CircleCheck, ClipboardCheck, PackageX, Undo2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { productById, roomById } from '@/lib/lab-data'
import { isProvisional } from '@/lib/lab-boxes'
import { formatLongDate, formatQty, formatShortDate, getAuditHistory } from '@/lib/audit-data'
import { useLosses } from './loss-store'

type View = 'pending' | 'confirmed'

export function LossManagerSheet() {
  const { managerOpen, setManagerOpen } = useLosses()
  return (
    <Sheet open={managerOpen} onOpenChange={setManagerOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 bg-[#F7FAFA] p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
      >
        {managerOpen && <LossManagerBody />}
      </SheetContent>
    </Sheet>
  )
}

function LossManagerBody() {
  const { boxes, sessionConfirmed, confirmLoss, restoreBox } = useLosses()
  const [view, setView] = useState<View>('pending')
  const [notice, setNotice] = useState('')

  const pending = boxes.filter(isProvisional)
  const confirmed = useMemo(
    () => [...getAuditHistory().seed, ...sessionConfirmed].sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    [sessionConfirmed],
  )

  const tabs: { id: View; label: string; count: number }[] = [
    { id: 'pending', label: 'À traiter', count: pending.length },
    { id: 'confirmed', label: 'Pertes confirmées', count: confirmed.length },
  ]

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
            <ClipboardCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <SheetTitle className="text-lg font-semibold text-brand">Gestion des pertes</SheetTitle>
            <SheetDescription className="text-pretty text-xs">
              Confirmez ou annulez les pertes provisoires et consultez l&apos;historique des pertes confirmées.
            </SheetDescription>
          </div>
        </div>
        <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Fermer" />}>
          <X className="size-4" aria-hidden="true" />
        </SheetClose>
      </header>

      <div className="border-b border-slate-200 bg-white px-5 py-3">
        <div role="tablist" aria-label="Type de pertes" className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`loss-tab-${tab.id}`}
              aria-selected={view === tab.id}
              aria-controls={`loss-panel-${tab.id}`}
              onClick={() => setView(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                view === tab.id ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-brand',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                  tab.id === 'pending' && tab.count > 0 ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-600',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>

      <div
        role="tabpanel"
        id={`loss-panel-${view}`}
        aria-labelledby={`loss-tab-${view}`}
        className="flex-1 overflow-y-auto p-5"
      >
        {view === 'pending' ? (
          pending.length === 0 ? (
            <EmptyState text="Aucune perte provisoire à traiter." />
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((box) => {
                const product = productById(box.productId)
                if (!product) return null
                return (
                  <li
                    key={box.id}
                    className="flex flex-col gap-3 rounded-xl border-l-4 border-orange-500 bg-white p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-brand">{product.name}</span>
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800 ring-1 ring-orange-300">
                          Perte provisoire
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">Lot {box.lot}</span> · {roomById(box.roomId)?.name} · remplacée il y a{' '}
                        {box.provisional?.daysAgo} j
                      </p>
                      <p className="text-sm text-slate-700">
                        Reste supposé perdu :{' '}
                        <span className="font-semibold tabular-nums text-orange-800">{formatQty(box.remaining, product.unit)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-brand text-white hover:bg-brand/90"
                        onClick={() => {
                          confirmLoss(box.id)
                          setNotice(`Perte confirmée : ${product.name}, lot ${box.lot}. La boîte a été retirée du laboratoire.`)
                        }}
                      >
                        <CircleCheck className="size-4" aria-hidden="true" />
                        Confirmer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Le reste de la boîte a été retrouvé"
                        onClick={() => {
                          restoreBox(box.id)
                          setNotice(`${product.name}, lot ${box.lot} : boîte retrouvée, retour à l'état normal.`)
                        }}
                      >
                        <Undo2 className="size-4" aria-hidden="true" />
                        Annuler la confirmation
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        ) : confirmed.length === 0 ? (
          <EmptyState text="Aucune perte confirmée." />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
                    {['Date', 'Salle', 'Produit', 'Quantité', 'Source'].map((col) => (
                      <th key={col} scope="col" className="px-4 py-2.5 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map((loss) => {
                    const product = productById(loss.productId)
                    return (
                      <tr key={loss.id} className="border-t border-slate-100">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          <time dateTime={loss.dateKey} title={formatLongDate(loss.dateKey)}>
                            {formatShortDate(loss.dateKey)}
                          </time>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{roomById(loss.roomId)?.name}</td>
                        <td className="px-4 py-3">
                          <span className="block font-medium text-slate-800">{product?.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">Lot {loss.lot}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-red-700">
                          {formatQty(loss.qty, product?.unit ?? '')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
                            <PackageX className="size-3" aria-hidden="true" />
                            Boîte non retrouvée
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/5">
      <div className="flex size-12 items-center justify-center rounded-full bg-canvas text-brand">
        <CircleCheck className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
