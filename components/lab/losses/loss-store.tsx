'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { toDateKey } from '@/lib/lab-data'
import { LAB_BOXES, type LabBox } from '@/lib/lab-boxes'
import type { ConfirmedLoss } from '@/lib/audit-data'

type LossStore = {
  boxes: LabBox[]
  sessionConfirmed: ConfirmedLoss[]
  managerOpen: boolean
  setManagerOpen: (open: boolean) => void
  confirmLoss: (boxId: string) => void
  restoreBox: (boxId: string) => void
}

const LossContext = createContext<LossStore | null>(null)

export function LossProvider({ children }: { children: React.ReactNode }) {
  const [boxes, setBoxes] = useState(LAB_BOXES)
  const [sessionConfirmed, setSessionConfirmed] = useState<ConfirmedLoss[]>([])
  const [managerOpen, setManagerOpen] = useState(false)

  const confirmLoss = useCallback(
    (boxId: string) => {
      const box = boxes.find((b) => b.id === boxId)
      if (!box) return
      setBoxes((current) => current.filter((b) => b.id !== boxId))
      setSessionConfirmed((list) =>
        list.some((l) => l.boxId === boxId)
          ? list
          : [
              ...list,
              {
                id: `confirmed-${box.id}`,
                boxId: box.id,
                roomId: box.roomId,
                productId: box.productId,
                lot: box.lot,
                qty: box.remaining,
                dateKey: toDateKey(new Date()),
              },
            ],
      )
    },
    [boxes],
  )

  const restoreBox = useCallback((boxId: string) => {
    setBoxes((current) => current.map((b) => (b.id === boxId ? { ...b, provisional: undefined } : b)))
  }, [])

  const value = useMemo(
    () => ({ boxes, sessionConfirmed, managerOpen, setManagerOpen, confirmLoss, restoreBox }),
    [boxes, sessionConfirmed, managerOpen, confirmLoss, restoreBox],
  )

  return <LossContext value={value}>{children}</LossContext>
}

export function useLosses() {
  const store = useContext(LossContext)
  if (!store) throw new Error('useLosses must be used inside <LossProvider>')
  return store
}
