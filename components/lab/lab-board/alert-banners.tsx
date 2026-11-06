'use client'

import { useState } from 'react'
import { ChevronRight, PackageX, TrendingDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BoardAlert = {
  id: string
  boxId: string
  kind: 'provisional' | 'high'
  title: string
  message: string
}

const VISIBLE_COUNT = 3

type Props = {
  alerts: BoardAlert[]
  onFocus: (boxId: string) => void
  onDismiss: (alertId: string) => void
}

export function AlertBanners({ alerts, onFocus, onDismiss }: Props) {
  const [showAll, setShowAll] = useState(false)
  if (alerts.length === 0) return null

  const visible = showAll ? alerts : alerts.slice(0, VISIBLE_COUNT)
  const hidden = alerts.length - visible.length

  return (
    <section aria-label="Alertes du laboratoire" className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {visible.map((alert) => {
          const provisional = alert.kind === 'provisional'
          const Icon = provisional ? PackageX : TrendingDown
          return (
            <li
              key={alert.id}
              className={cn(
                'flex items-stretch overflow-hidden rounded-lg ring-1 animate-in fade-in-0 slide-in-from-top-1 duration-200',
                provisional ? 'bg-orange-50 ring-orange-200' : 'bg-red-50 ring-red-200',
              )}
            >
              <span className={cn('w-1 shrink-0', provisional ? 'bg-orange-500' : 'bg-red-800')} aria-hidden="true" />
              <button
                type="button"
                onClick={() => onFocus(alert.boxId)}
                className="group flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                <Icon className={cn('size-4 shrink-0', provisional ? 'text-orange-600' : 'text-red-800')} aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-sm font-semibold', provisional ? 'text-orange-900' : 'text-red-900')}>{alert.title}</span>
                  <span className={cn('text-pretty text-xs', provisional ? 'text-orange-800' : 'text-red-800')}>{alert.message}</span>
                </span>
                <span className="hidden shrink-0 items-center gap-0.5 text-xs font-medium text-brand group-hover:underline sm:flex">
                  Voir la boîte
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                aria-label={`Masquer l'alerte : ${alert.title}`}
                className="flex w-10 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      {(hidden > 0 || showAll) && alerts.length > VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-fit rounded-md text-xs font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {showAll ? 'Réduire les alertes' : `Afficher ${hidden} autre${hidden > 1 ? 's' : ''} alerte${hidden > 1 ? 's' : ''}`}
        </button>
      )}
    </section>
  )
}
