import { PEOPLE, PRODUCTS, productById, toDateKey, type Product } from '@/lib/lab-data'

export type Category = { id: string; name: string }

export const CATEGORIES: Category[] = [
  { id: 'immuno', name: 'Immuno-sérologie' },
  { id: 'biochimie', name: 'Biochimie' },
  { id: 'hematologie', name: 'Hématologie' },
  { id: 'hormonologie', name: 'Hormonologie' },
  { id: 'microbiologie', name: 'Microbiologie' },
]

export const PRODUCT_CATEGORY: Record<string, string> = {
  hbs: 'immuno',
  hiv: 'immuno',
  crp: 'immuno',
  glu: 'biochimie',
  crea: 'biochimie',
  nfs: 'hematologie',
  tsh: 'hormonologie',
  gram: 'microbiologie',
}

const PRODUCT_ROOMS: Record<string, string[]> = {
  hbs: ['serologie', 'immunologie'],
  hiv: ['serologie', 'immunologie'],
  crp: ['serologie', 'immunologie', 'biochimie'],
  glu: ['biochimie', 'hormonologie'],
  crea: ['biochimie'],
  nfs: ['hematologie'],
  tsh: ['hormonologie', 'immunologie'],
  gram: ['microbiologie'],
}

export type AuditRecord = {
  id: string
  dateKey: string
  previousDateKey: string | null
  roomId: string
  productId: string
  lot: string
  boxId: string
  boxNo: number
  qty: number
  expected: number
  declared: number
  ecart: number
  personId: string
}

export type RoomStat = { roomId: string; consumption: number; losses: number; rate: number }

export type ProductStat = {
  product: Product
  consumption: number
  losses: number
  rate: number
  rooms: RoomStat[]
  worstRoom: RoomStat | null
}

/** A presumed loss (remainder of a replaced box never found) that was confirmed by management. */
export type ConfirmedLoss = {
  id: string
  boxId: string
  roomId: string
  productId: string
  lot: string
  qty: number
  dateKey: string
}

export type LossEvent =
  | { kind: 'ecart'; id: string; dateKey: string; qty: number; record: AuditRecord }
  | { kind: 'unfound'; id: string; dateKey: string; qty: number; loss: ConfirmedLoss }

export type BoxHistory = {
  boxId: string
  lot: string
  boxNo: number | null
  firstDateKey: string
  lastDateKey: string
  consumption: number
  losses: number
  events: LossEvent[]
}

export type RateTone = 'good' | 'warn' | 'bad'

export const HISTORY_DAYS = 90

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shiftDateKey(key: string, days: number) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/**
 * Simulates the daily sheets per (room, product): each entry deducts the consumed quantity from the
 * previously declared balance to get the expected balance. Any shortfall in the declared balance is a loss.
 */
export function buildAuditHistory(today: Date, days = HISTORY_DAYS): AuditRecord[] {
  const records: AuditRecord[] = []
  let pairIndex = 0

  for (const product of PRODUCTS) {
    for (const roomId of PRODUCT_ROOMS[product.id] ?? []) {
      pairIndex++
      const rand = seededRandom(pairIndex * 7919 + product.capacity * 31)
      const lossChance = 0.03 + rand() * 0.2
      const dailyUsage = product.capacity / (6 + rand() * 10)
      let lotIndex = 0
      let boxNo = 1
      let remaining = Math.round(product.capacity * (0.4 + rand() * 0.6))
      let previousDateKey: string | null = null

      for (let offset = days; offset >= 1; offset--) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        if (rand() < (isWeekend ? 0.75 : 0.15)) continue

        const qty = Math.max(1, Math.round(dailyUsage * (0.5 + rand())))
        let expected = remaining - qty
        if (expected < 0) {
          expected += product.capacity
          boxNo++
          if (rand() < 0.5) lotIndex = (lotIndex + 1) % product.lots.length
        }

        const loss = rand() < lossChance ? Math.max(1, Math.round(product.capacity * (0.005 + rand() * 0.025))) : 0
        const declared = Math.max(0, expected - loss)
        const dateKey = toDateKey(date)

        records.push({
          id: `${roomId}-${product.id}-${dateKey}`,
          dateKey,
          previousDateKey,
          roomId,
          productId: product.id,
          lot: product.lots[lotIndex],
          boxId: `${roomId}-${product.id}-${boxNo}`,
          boxNo,
          qty,
          expected,
          declared,
          ecart: expected - declared,
          personId: PEOPLE[Math.floor(rand() * PEOPLE.length)].id,
        })

        remaining = declared
        previousDateKey = dateKey
      }
    }
  }

  return records
}

export const lossRate = (losses: number, consumption: number) => (consumption > 0 ? (losses / consumption) * 100 : 0)

export function rateTone(rate: number): RateTone {
  if (rate < 1) return 'good'
  if (rate <= 3) return 'warn'
  return 'bad'
}

/** Ranks rooms by loss rate (losses / consumption), never by absolute losses. */
export function aggregateByProduct(records: AuditRecord[], confirmed: ConfirmedLoss[] = []): ProductStat[] {
  const byProduct = new Map<string, Map<string, { consumption: number; losses: number }>>()

  const add = (productId: string, roomId: string, consumption: number, losses: number) => {
    const rooms = byProduct.get(productId) ?? new Map()
    const current = rooms.get(roomId) ?? { consumption: 0, losses: 0 }
    current.consumption += consumption
    current.losses += losses
    rooms.set(roomId, current)
    byProduct.set(productId, rooms)
  }

  for (const record of records) add(record.productId, record.roomId, record.qty, record.ecart)
  for (const loss of confirmed) add(loss.productId, loss.roomId, 0, loss.qty)

  const stats: ProductStat[] = []
  for (const [productId, roomMap] of byProduct) {
    const product = productById(productId)
    if (!product) continue

    const rooms: RoomStat[] = [...roomMap.entries()]
      .map(([roomId, { consumption, losses }]) => ({ roomId, consumption, losses, rate: lossRate(losses, consumption) }))
      .sort((a, b) => b.rate - a.rate || b.losses - a.losses)

    const consumption = rooms.reduce((sum, r) => sum + r.consumption, 0)
    const losses = rooms.reduce((sum, r) => sum + r.losses, 0)
    stats.push({
      product,
      consumption,
      losses,
      rate: lossRate(losses, consumption),
      rooms,
      worstRoom: rooms[0] && rooms[0].losses > 0 ? rooms[0] : null,
    })
  }

  return stats.sort((a, b) => b.rate - a.rate)
}

/**
 * Builds the per-box timeline. Confirmed "box not found" losses are attached to their box when it is part of
 * the history, otherwise to the latest earlier box of the same lot, otherwise they get a row of their own.
 */
export function groupBoxes(records: AuditRecord[], confirmed: ConfirmedLoss[] = []): BoxHistory[] {
  const boxes = new Map<string, BoxHistory>()
  const sorted = [...records].sort((a, b) => a.dateKey.localeCompare(b.dateKey))

  for (const record of sorted) {
    const box = boxes.get(record.boxId) ?? {
      boxId: record.boxId,
      lot: record.lot,
      boxNo: record.boxNo,
      firstDateKey: record.dateKey,
      lastDateKey: record.dateKey,
      consumption: 0,
      losses: 0,
      events: [],
    }
    box.lastDateKey = record.dateKey
    box.consumption += record.qty
    box.losses += record.ecart
    if (record.ecart > 0) {
      box.events.push({ kind: 'ecart', id: record.id, dateKey: record.dateKey, qty: record.ecart, record })
    }
    boxes.set(record.boxId, box)
  }

  for (const loss of confirmed) {
    const event: LossEvent = { kind: 'unfound', id: loss.id, dateKey: loss.dateKey, qty: loss.qty, loss }
    const sameLot = [...boxes.values()]
      .filter((b) => b.lot === loss.lot && b.firstDateKey <= loss.dateKey)
      .sort((a, b) => b.lastDateKey.localeCompare(a.lastDateKey))[0]
    const target = boxes.get(loss.boxId) ?? sameLot

    if (target) {
      target.losses += loss.qty
      target.lastDateKey = target.lastDateKey > loss.dateKey ? target.lastDateKey : loss.dateKey
      target.events.push(event)
    } else {
      boxes.set(loss.boxId, {
        boxId: loss.boxId,
        lot: loss.lot,
        boxNo: null,
        firstDateKey: loss.dateKey,
        lastDateKey: loss.dateKey,
        consumption: 0,
        losses: loss.qty,
        events: [event],
      })
    }
  }

  for (const box of boxes.values()) box.events.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  return [...boxes.values()].sort((a, b) => b.lastDateKey.localeCompare(a.lastDateKey))
}

/** Historical confirmed losses: a few past boxes whose remainder was never found. */
export function buildConfirmedSeed(history: AuditRecord[]): ConfirmedLoss[] {
  const picks: { roomId: string; productId: string }[] = [
    { roomId: 'biochimie', productId: 'glu' },
    { roomId: 'serologie', productId: 'hiv' },
    { roomId: 'hormonologie', productId: 'tsh' },
    { roomId: 'hematologie', productId: 'nfs' },
  ]

  return picks.flatMap(({ roomId, productId }, index) => {
    const product = productById(productId)
    const boxes = groupBoxes(history.filter((r) => r.roomId === roomId && r.productId === productId))
    const box = boxes[1 + (index % 2)]
    if (!product || !box) return []
    return [
      {
        id: `seed-confirmed-${box.boxId}`,
        boxId: box.boxId,
        roomId,
        productId,
        lot: box.lot,
        qty: Math.max(2, Math.round(product.capacity * (0.04 + index * 0.015))),
        dateKey: shiftDateKey(box.lastDateKey, 1),
      },
    ]
  })
}

let historyCache: { key: string; history: AuditRecord[]; seed: ConfirmedLoss[] } | null = null

/** Client-only: the simulated history is anchored on the user's local "today". */
export function getAuditHistory() {
  const key = toDateKey(new Date())
  if (historyCache?.key !== key) {
    const history = buildAuditHistory(new Date())
    historyCache = { key, history, seed: buildConfirmedSeed(history) }
  }
  return historyCache
}

const numberFormat = new Intl.NumberFormat('fr-FR')
export const formatNumber = (value: number) => numberFormat.format(value)
export const formatQty = (value: number, unit: string) =>
  `${numberFormat.format(value)} ${value <= 1 && unit.endsWith('s') ? unit.slice(0, -1) : unit}`
export const formatRate = (rate: number) => `${rate.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`

const dayLabel = (date: Date) => (date.getDate() === 1 ? '1er' : String(date.getDate()))
const monthLabel = (date: Date) => date.toLocaleDateString('fr-FR', { month: 'long' })

export function formatShortDate(key: string) {
  return parseDateKey(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function formatLongDate(key: string) {
  return parseDateKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatPeriod(fromKey: string, toKey: string) {
  const from = parseDateKey(fromKey)
  const to = parseDateKey(toKey)
  if (fromKey === toKey) return `Le ${dayLabel(to)} ${monthLabel(to)}`
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `Du ${dayLabel(from)} au ${dayLabel(to)} ${monthLabel(to)}`
  }
  return `Du ${dayLabel(from)} ${monthLabel(from)} au ${dayLabel(to)} ${monthLabel(to)}`
}
