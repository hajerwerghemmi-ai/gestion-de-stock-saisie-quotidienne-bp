'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, PackageOpen, PackageX, Search, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROOMS, productById, roomById } from '@/lib/lab-data'
import { boxLossRate, isHighLoss, isProvisional } from '@/lib/lab-boxes'
import { formatQty, formatRate } from '@/lib/audit-data'
import { useLosses } from '@/components/lab/losses/loss-store'
import { RoomColumn } from '@/components/lab/lab-board/room-column'
import { AlertBanners, type BoardAlert } from '@/components/lab/lab-board/alert-banners'

const HIGHLIGHT_MS = 3600

export function LabBoard() {
  const { boxes, setManagerOpen } = useLosses()
  const [query, setQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState('all')
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  const alerts = useMemo<BoardAlert[]>(() => {
    const list: BoardAlert[] = []
    for (const box of boxes) {
      const product = productById(box.productId)
      const room = roomById(box.roomId)
      if (!product || !room) continue
      if (isProvisional(box)) {
        list.push({
          id: `provisional-${box.id}`,
          boxId: box.id,
          kind: 'provisional',
          title: `${room.name} · ${product.name}`,
          message: `Une nouvelle boîte a été sortie alors que la précédente (lot ${box.lot}) contient encore ${formatQty(box.remaining, product.unit)}.`,
        })
      }
      if (isHighLoss(box)) {
        list.push({
          id: `high-${box.id}`,
          boxId: box.id,
          kind: 'high',
          title: `${room.name} · ${product.name}`,
          message: `La boîte du lot ${box.lot} enregistre une perte élevée de ${formatRate(boxLossRate(box))} (${formatQty(box.losses ?? 0, product.unit)}).`,
        })
      }
    }
    return list.sort((a, b) => Number(a.kind === 'high') - Number(b.kind === 'high'))
  }, [boxes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return boxes
    return boxes.filter((box) => {
      const name = productById(box.productId)?.name.toLowerCase() ?? ''
      return name.includes(q) || box.lot.toLowerCase().includes(q)
    })
  }, [boxes, query])

  const rooms = roomFilter === 'all' ? ROOMS : ROOMS.filter((r) => r.id === roomFilter)
  const counts = {
    provisional: filtered.filter(isProvisional).length,
    high: filtered.filter(isHighLoss).length,
    opened: filtered.filter((b) => b.status === 'entamee').length,
    stored: filtered.filter((b) => b.status === 'stockee').length,
  }

  function focusBox(boxId: string) {
    const box = boxes.find((b) => b.id === boxId)
    if (!box) return
    if (roomFilter !== 'all' && roomFilter !== box.roomId) setRoomFilter('all')
    if (query && !filtered.some((b) => b.id === boxId)) setQuery('')
    setHighlightId(boxId)
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS)

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(`box-${boxId}`)
        if (!el) return
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center', inline: 'center' })
        el.focus({ preventScroll: true })
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <AlertBanners
        alerts={alerts.filter((a) => !dismissed.has(a.id))}
        onFocus={focusBox}
        onDismiss={(id) => setDismissed((prev) => new Set(prev).add(id))}
      />

      <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par produit ou lot"
            aria-label="Rechercher par produit ou lot"
            className="pl-9"
          />
        </div>

        <Select
          value={roomFilter}
          onValueChange={(value) => setRoomFilter(value ?? 'all')}
          items={[{ value: 'all', label: 'Toutes les salles' }, ...ROOMS.map((r) => ({ value: r.id, label: r.name }))]}
        >
          <SelectTrigger className="w-full md:w-52" aria-label="Filtrer par salle">
            <SelectValue placeholder="Toutes les salles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les salles</SelectItem>
            {ROOMS.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="flex flex-wrap items-center gap-2 text-xs" aria-label="Résumé des boîtes">
        <Legend icon={PackageX} tone="bg-orange-100 text-orange-800" label="Pertes provisoires" value={counts.provisional} />
        <Legend icon={TrendingDown} tone="bg-red-100 text-red-800" label="Pertes élevées" value={counts.high} />
        <Legend icon={PackageOpen} tone="bg-canvas text-brand" label="Ouvertes" value={counts.opened} />
        <Legend icon={Archive} tone="bg-slate-200/70 text-slate-600" label="Stockées" value={counts.stored} />
      </ul>

      <div className="-mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        {rooms.map((room) => (
          <RoomColumn
            key={room.id}
            room={room}
            boxes={filtered.filter((b) => b.roomId === room.id)}
            highlightId={highlightId}
            onManage={() => setManagerOpen(true)}
          />
        ))}
      </div>
    </div>
  )
}

function Legend({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: string
  label: string
  value: number
}) {
  return (
    <li className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium', tone)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
      <span className="font-semibold tabular-nums">{value}</span>
    </li>
  )
}
