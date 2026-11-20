import { describe, expect, it } from 'vitest'
import { changeFor, formatMoney, formatQty, parseQty, pesosToCents } from './money'

describe('money', () => {
  it('formats centavos as pesos only at display time', () => {
    expect(formatMoney(8000)).toBe('₱80.00')
    expect(formatMoney(2850)).toBe('₱28.50')
    expect(formatMoney(-5150)).toBe('-₱51.50')
    expect(formatMoney(123456789)).toBe('₱1,234,567.89')
  })

  it('parses peso input into centavos', () => {
    expect(pesosToCents('80')).toBe(8000)
    expect(pesosToCents('1,250.50')).toBe(125050)
    expect(pesosToCents('₱28.5')).toBe(2850)
    expect(pesosToCents('')).toBeNull()
    expect(pesosToCents('abc')).toBeNull()
  })

  it('parses quantities', () => {
    expect(parseQty('18')).toBe(18)
    expect(parseQty('1.5')).toBe(1.5)
    expect(parseQty('')).toBeNull()
    expect(parseQty('x')).toBeNull()
    expect(formatQty(1.5)).toBe('1.5')
  })

  it('computes change and rejects cash below the total', () => {
    expect(changeFor(10000, 8000)).toEqual({ ok: true, changeCents: 2000, shortCents: 0 })
    expect(changeFor(8000, 8000)).toEqual({ ok: true, changeCents: 0, shortCents: 0 })
    expect(changeFor(5000, 8000)).toEqual({ ok: false, changeCents: 0, shortCents: 3000 })
    expect(changeFor(Number.NaN, 8000)).toEqual({ ok: false, changeCents: 0, shortCents: 8000 })
  })
})
