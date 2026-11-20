import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  addYears,
  daysInMonth,
  formatDateLabel,
  formatMonthLabel,
  monthGrid,
} from './calendar'

describe('calendar', () => {
  it('moves days across month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('clamps the day when adding months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-11-12', -1)).toBe('2026-10-12')
    expect(addYears('2026-11-12', 1)).toBe('2027-11-12')
  })

  it('knows month lengths including leap years', () => {
    expect(daysInMonth('2026-02-01')).toBe(28)
    expect(daysInMonth('2024-02-01')).toBe(29)
    expect(daysInMonth('2026-11-01')).toBe(30)
  })

  it('builds a six-week Sunday-first grid', () => {
    const cells = monthGrid('2026-11-01')
    expect(cells).toHaveLength(42)
    // 1 Nov 2026 is a Sunday
    expect(cells[0]!.key).toBe('2026-11-01')
    expect(cells[0]!.inMonth).toBe(true)
    expect(cells[29]!.key).toBe('2026-11-30')
    expect(cells[30]!.inMonth).toBe(false)
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(30)
  })

  it('formats labels', () => {
    expect(formatDateLabel('2026-11-12')).toBe('Nov 12, 2026')
    expect(formatMonthLabel('2026-11-01')).toBe('November 2026')
  })
})
