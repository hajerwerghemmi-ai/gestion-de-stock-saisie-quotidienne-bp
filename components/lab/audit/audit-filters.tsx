import { Building2, CalendarDays, FlaskConical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROOMS } from '@/lib/lab-data'
import { CATEGORIES } from '@/lib/audit-data'

type Props = {
  from: string
  to: string
  minDate: string
  maxDate: string
  category: string
  room: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onRoomChange: (value: string) => void
}

export function AuditFilters(props: Props) {
  const { from, to, minDate, maxDate, category, room } = props

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 lg:grid-cols-4">
      <DateField id="audit-from" label="Du" value={from} min={minDate} max={to} onChange={props.onFromChange} />
      <DateField id="audit-to" label="Au" value={to} min={from} max={maxDate} onChange={props.onToChange} />

      <FilterField icon={FlaskConical} label="Catégorie">
        <Select
          value={category}
          onValueChange={(value) => props.onCategoryChange(value ?? 'all')}
          items={[{ value: 'all', label: 'Toutes les catégories' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.name }))]}
        >
          <SelectTrigger className="h-9 w-full" aria-label="Filtrer par catégorie">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField icon={Building2} label="Salle">
        <Select
          value={room}
          onValueChange={(value) => props.onRoomChange(value ?? 'all')}
          items={[{ value: 'all', label: 'Toutes les salles' }, ...ROOMS.map((r) => ({ value: r.id, label: r.name }))]}
        >
          <SelectTrigger className="h-9 w-full" aria-label="Filtrer par salle">
            <SelectValue placeholder="Toutes les salles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les salles</SelectItem>
            {ROOMS.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
    </div>
  )
}

function FilterField({
  icon: Icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="size-3.5 text-brand/70" aria-hidden="true" />
        {label}
      </label>
      {children}
    </div>
  )
}

function DateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string
  label: string
  value: string
  min: string
  max: string
  onChange: (value: string) => void
}) {
  return (
    <FilterField icon={CalendarDays} label={label} htmlFor={id}>
      <Input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        required
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="h-9 tabular-nums"
      />
    </FilterField>
  )
}
