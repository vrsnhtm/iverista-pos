import { describe, expect, it } from 'vitest'
import type { Order } from '../types'
import { dailyBuckets, monthlyBuckets, ordersForPeriod, periodLabel } from './reporting'
import { buildOrderItems } from './sales'
import { fixtureDrinks, fixtureIngredients } from './fixtures'

function makeOrder(createdAt: string, overrides: Partial<Order> = {}): Order {
  const items = buildOrderItems(
    [{ drinkId: 'coffee-americano', qty: 1 }],
    fixtureDrinks(),
    fixtureIngredients(),
  )
  const totalCents = items.reduce((sum, item) => sum + item.lineSalesCents, 0)
  const totalCostCents = items.reduce((sum, item) => sum + item.lineCostCents, 0)
  return {
    id: `order-${createdAt}`,
    number: 1,
    createdAt,
    type: 'dine-in',
    payment: 'cash',
    subtotalCents: totalCents,
    totalCents,
    totalCostCents,
    profitCents: totalCents - totalCostCents,
    costMissing: false,
    status: 'done',
    voided: false,
    items,
    ...overrides,
  }
}

const orders = [
  makeOrder('2026-11-12T10:00:00'),
  makeOrder('2026-11-12T15:00:00'),
  makeOrder('2026-11-13T09:00:00'),
  makeOrder('2026-12-01T09:00:00'),
  makeOrder('2025-12-31T09:00:00'),
  makeOrder('2026-11-14T09:00:00', { voided: true }),
]

describe('reporting', () => {
  it('filters orders by day, month and year', () => {
    expect(ordersForPeriod(orders, 'day', '2026-11-12')).toHaveLength(2)
    expect(ordersForPeriod(orders, 'month', '2026-11-12')).toHaveLength(4) // includes voided
    expect(ordersForPeriod(orders, 'year', '2026-11-12')).toHaveLength(5)
    expect(ordersForPeriod(orders, 'day', '2026-11-14')).toHaveLength(1) // voided still listed
  })

  it('labels each period', () => {
    expect(periodLabel('day', '2026-11-12')).toBe('Nov 12, 2026')
    expect(periodLabel('month', '2026-11-12')).toBe('November 2026')
    expect(periodLabel('year', '2026-11-12')).toBe('2026')
  })

  it('builds zero-filled daily buckets and skips voided orders', () => {
    const buckets = dailyBuckets(orders, '2026-11-12')
    expect(buckets).toHaveLength(30)
    const day12 = buckets.find((b) => b.key === '2026-11-12')!
    expect(day12.orderCount).toBe(2)
    expect(day12.salesCents).toBe(16000)
    expect(day12.costCents).toBe(5700)
    expect(day12.profitCents).toBe(10300)
    expect(buckets.find((b) => b.key === '2026-11-14')!.orderCount).toBe(0)
    expect(buckets.find((b) => b.key === '2026-11-13')!.salesCents).toBe(8000)
  })

  it('builds twelve monthly buckets with totals', () => {
    const buckets = monthlyBuckets(orders, '2026-11-12')
    expect(buckets).toHaveLength(12)
    expect(buckets[10]!.label).toBe('Nov')
    expect(buckets[10]!.orderCount).toBe(3)
    expect(buckets[10]!.salesCents).toBe(24000)
    expect(buckets[11]!.salesCents).toBe(8000)
    expect(buckets[0]!.salesCents).toBe(0)
  })
})
