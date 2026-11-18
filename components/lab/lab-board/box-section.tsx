'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  defaultOpen?: boolean
  forceOpen?: boolean
  children: React.ReactNode
}

export function BoxSection({ title, icon: Icon, count, defaultOpen = false, forceOpen = false, children }: Props) {
  const [userOpen, setUserOpen] = useState(defaultOpen)
  const open = userOpen || forceOpen
  const panelId = useId()

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setUserOpen(!open)}
        className="flex items-center gap-2 rounded-md px-1 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="flex-1">{title}</span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] tabular-nums text-slate-600">{count}</span>
        <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <div
        id={panelId}
        inert={!open}
        className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
