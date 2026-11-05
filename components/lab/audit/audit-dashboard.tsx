'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { toDateKey } from '@/lib/lab-data'
import { aggregateByProduct, buildAuditHistory, HISTORY_DAYS, PRODUCT_CATEGORY, shiftDateKey } from '@/lib/audit-data'
import { AuditFilters } from './audit-filters'
import { AuditSummary } from './audit-summary'
import { LossTable } from './loss-table'
import { AuditSheet } from './audit-sheet'
import type { AuditTarget } from './product-drilldown'

const subscribe = () => () => {}

// The history is anchored on the user's local "today", so it is rendered client-side only.
export function AuditDashboard() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  if (!mounted) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Chargement des analyses">
        <div className="h-[74px] animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-black/5" />
        <div className="h-[480px] animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-black/5" />
      </div>
    )
  }
  return <AuditDashboardClient />
}

function AuditDashboardClient() {
  const [todayKey] = useState(() => toDateKey(new Date()))
  const history = useMemo(() => buildAuditHistory(new Date()), [])
  const maxDate = shiftDateKey(todayKey, -1)
  const minDate = shiftDateKey(todayKey, -HISTORY_DAYS)

  const [from, setFrom] = useState(() => shiftDateKey(todayKey, -30))
  const [to, setTo] = useState(maxDate)
  const [category, setCategory] = useState('all')
  const [room, setRoom] = useState('all')
  const [target, setTarget] = useState<AuditTarget | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(
    () =>
      history.filter(
        (r) =>
          r.dateKey >= from &&
          r.dateKey <= to &&
          (category === 'all' || PRODUCT_CATEGORY[r.productId] === category) &&
          (room === 'all' || r.roomId === room),
      ),
    [history, from, to, category, room],
  )

  const stats = useMemo(() => aggregateByProduct(filtered), [filtered])

  return (
    <div className="flex flex-col gap-6">
      <AuditFilters
        from={from}
        to={to}
        minDate={minDate}
        maxDate={maxDate}
        category={category}
        room={room}
        onFromChange={setFrom}
        onToChange={setTo}
        onCategoryChange={setCategory}
        onRoomChange={setRoom}
      />
      <AuditSummary stats={stats} incidents={filtered.filter((r) => r.ecart > 0).length} />
      <LossTable
        stats={stats}
        records={filtered}
        onOpenAudit={(next) => {
          setTarget(next)
          setSheetOpen(true)
        }}
      />
      <AuditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        target={target}
        history={history}
        minDate={minDate}
        maxDate={maxDate}
      />
    </div>
  )
}
