import { Archive, Inbox, LockOpen, TriangleAlert } from 'lucide-react'
import type { Room } from '@/lib/lab-data'
import { hasWarning, sortOpenBoxes, type LabBox } from '@/lib/lab-boxes'
import { BoxCard } from '@/components/lab/lab-board/box-card'
import { BoxSection } from '@/components/lab/lab-board/box-section'

type Props = {
  room: Room
  boxes: LabBox[]
  highlightId: string | null
  onManage: () => void
}

export function RoomColumn({ room, boxes, highlightId, onManage }: Props) {
  const opened = sortOpenBoxes(boxes.filter((b) => b.status === 'entamee'))
  const stored = boxes.filter((b) => b.status === 'stockee')
  const alerts = opened.filter(hasWarning).length
  const headingId = `col-${room.id}`

  return (
    <section aria-labelledby={headingId} className="flex w-72 shrink-0 snap-start flex-col rounded-xl bg-white/60 ring-1 ring-black/5">
      <header className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3">
        <h2 id={headingId} className="truncate text-sm font-semibold text-brand">
          {room.name}
        </h2>
        <div className="flex items-center gap-1.5">
          {alerts > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
              <TriangleAlert className="size-3" aria-hidden="true" />
              {alerts}
              <span className="sr-only">alerte{alerts > 1 ? 's' : ''}</span>
            </span>
          )}
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold tabular-nums text-brand">
            {boxes.length}
            <span className="sr-only"> boîte{boxes.length > 1 ? 's' : ''}</span>
          </span>
        </div>
      </header>

      {boxes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <Inbox className="size-5 text-slate-400" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">Aucune boîte correspondante</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          <BoxSection
            title="Boîtes ouvertes (En cours)"
            icon={LockOpen}
            count={opened.length}
            defaultOpen
            forceOpen={opened.some((b) => b.id === highlightId)}
          >
            {opened.length > 0 ? (
              <ul className="flex flex-col gap-2.5 px-0.5 pb-1 pt-1.5">
                {opened.map((box) => (
                  <li key={box.id}>
                    <BoxCard box={box} highlighted={box.id === highlightId} onManage={onManage} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 py-3 text-xs text-muted-foreground">Aucune boîte ouverte</p>
            )}
          </BoxSection>

          <div className="h-px bg-black/5" aria-hidden="true" />

          <BoxSection title="Boîtes stockées" icon={Archive} count={stored.length}>
            {stored.length > 0 ? (
              <ul className="flex flex-col gap-2 px-0.5 pb-1 pt-1.5">
                {stored.map((box) => (
                  <li key={box.id}>
                    <BoxCard box={box} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 py-3 text-xs text-muted-foreground">Aucune boîte en stock</p>
            )}
          </BoxSection>
        </div>
      )}
    </section>
  )
}
