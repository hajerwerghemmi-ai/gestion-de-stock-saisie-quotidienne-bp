'use client'

import { useState } from 'react'
import { CalendarDays, FlaskRound, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DailyEntry } from '@/components/lab/daily-entry/daily-entry'
import { LabBoard } from '@/components/lab/lab-board/lab-board'
import { AuditDashboard } from '@/components/lab/audit/audit-dashboard'

const TABS = [
  { id: 'saisie', label: 'Saisie quotidienne', icon: CalendarDays },
  { id: 'labo', label: 'Au laboratoire', icon: FlaskRound },
  { id: 'audit', label: 'Pertes et Audit', icon: ShieldCheck },
] as const

type TabId = (typeof TABS)[number]['id']

export function ConsommationPage() {
  const [tab, setTab] = useState<TabId>('saisie')

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-800/70">Gestion de stock</p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-brand md:text-3xl">Consommation</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Enregistrez et clôturez chaque jour les consommations de réactifs par salle.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Sections de consommation"
        className="flex w-full gap-1 overflow-x-auto rounded-xl bg-white/70 p-1 shadow-sm ring-1 ring-black/5 sm:w-fit"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
              tab === id ? 'bg-brand text-white shadow-md' : 'text-slate-600 hover:bg-white hover:text-brand',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        key={tab}
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
      >
        {tab === 'saisie' ? <DailyEntry /> : tab === 'labo' ? <LabBoard /> : <AuditDashboard />}
      </section>
    </div>
  )
}
