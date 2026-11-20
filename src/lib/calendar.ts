import { localDateKey } from './dates'

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return localDateKey(date)
}

/** Add months, clamping the day to the target month (Jan 31 + 1 month = Feb 28). */
export function addMonths(key: string, months: number): string {
  const date = parseDateKey(key)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))
  return localDateKey(date)
}

export function addYears(key: string, years: number): string {
  return addMonths(key, years * 12)
}

export function startOfMonthKey(key: string): string {
  return `${key.slice(0, 7)}-01`
}

export function daysInMonth(key: string): number {
  const date = parseDateKey(startOfMonthKey(key))
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export interface CalendarCell {
  key: string
  day: number
  inMonth: boolean
}

/** Six Sunday-first weeks covering the month of `key`. */
export function monthGrid(key: string): CalendarCell[] {
  const base = parseDateKey(startOfMonthKey(key))
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return {
      key: localDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === base.getMonth(),
    }
  })
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatDateLabel(key: string): string {
  const date = parseDateKey(key)
  return `${MONTHS[date.getMonth()]!.slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`
}

export function formatDayShort(key: string): string {
  const date = parseDateKey(key)
  return `${MONTHS[date.getMonth()]!.slice(0, 3)} ${date.getDate()}`
}

export function formatMonthShort(key: string): string {
  return MONTHS[parseDateKey(key).getMonth()]!.slice(0, 3)
}

export function formatMonthLabel(key: string): string {
  const date = parseDateKey(key)
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function formatYearLabel(key: string): string {
  return key.slice(0, 4)
}
