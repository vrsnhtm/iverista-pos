import { useEffect, useState } from 'react'
import { addMonths, formatMonthLabel, monthGrid } from '../lib/calendar'
import { localDateKey } from '../lib/dates'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface CalendarProps {
  selected: string
  onSelect: (key: string) => void
  markedDays?: string[]
}

export function Calendar({ selected, onSelect, markedDays = [] }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(selected.slice(0, 7))

  useEffect(() => {
    setViewMonth(selected.slice(0, 7))
  }, [selected])

  const cells = monthGrid(`${viewMonth}-01`)
  const today = localDateKey()
  const marked = new Set(markedDays)

  return (
    <section className="card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          className="btn btn-secondary w-12 px-0 text-lg"
          onClick={() => setViewMonth(addMonths(`${viewMonth}-01`, -1).slice(0, 7))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="text-sm font-extrabold">{formatMonthLabel(`${viewMonth}-01`)}</div>
        <button
          className="btn btn-secondary w-12 px-0 text-lg"
          onClick={() => setViewMonth(addMonths(`${viewMonth}-01`, 1).slice(0, 7))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-mocha">
        {WEEKDAYS.map((day, index) => (
          <div key={index}>{day}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isSelected = cell.key === selected
          const isToday = cell.key === today
          return (
            <button
              key={cell.key}
              onClick={() => onSelect(cell.key)}
              aria-pressed={isSelected}
              aria-label={`${cell.key}${marked.has(cell.key) ? ', has sales' : ''}`}
              className={`relative flex h-12 items-center justify-center rounded-lg text-sm font-semibold transition ${
                isSelected
                  ? 'bg-espresso text-cream'
                  : cell.inMonth
                    ? 'bg-white ring-1 ring-latte hover:bg-latte/40'
                    : 'text-mocha/40 hover:bg-latte/30'
              } ${isToday && !isSelected ? 'ring-2 ring-caramel' : ''}`}
            >
              {cell.day}
              {marked.has(cell.key) && !isSelected ? (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-caramel" />
              ) : null}
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-[11px] text-mocha">
        Days with a dot have recorded sales. Ringed day is today.
      </p>
    </section>
  )
}
