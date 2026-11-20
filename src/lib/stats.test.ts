import { describe, expect, it } from 'vitest'
import type { Order } from '../types'
import { computeDayStats } from './stats'
import { buildOrderItems } from './sales'
import { fixtureDrinks, fixtureIngredients } from './fixtures'

let orderCounter = 0

function makeOrder(
  items: Order['items'],
  overrides: Partial<Order> = {},
): Order {
  orderCounter += 1
  const totalCents = items.reduce((sum, i) => sum + i.lineSalesCents, 0)
  const totalCostCents = items.reduce((sum, i) => sum + i.lineCostCents, 0)
  return {
    id: `order-${orderCounter}`,
    number: orderCounter,
    createdAt: '2026-11-12T02:00:00.000Z',
    type: 'dine-in',
    payment: 'cash',
    subtotalCents: totalCents,
    totalCents,
    totalCostCents,
    profitCents: totalCents - totalCostCents,
    costMissing: items.some((i) => i.costMissing),
    status: 'done',
    voided: false,
    items,
    ...overrides,
  }
}

describe('stats', () => {
  it('aggregates today sales, cost, profit, margin and per-drink rows', () => {
    const drinks = fixtureDrinks()
    const ingredients = fixtureIngredients()
    const americanos = buildOrderItems(
      [{ drinkId: 'coffee-americano', qty: 2 }],
      drinks,
      ingredients,
    )
    const longBlacks = buildOrderItems(
      [{ drinkId: 'coffee-long-black', qty: 1 }],
      drinks,
      ingredients,
    )
    const stats = computeDayStats([makeOrder(americanos), makeOrder(longBlacks)])

    expect(stats.orderCount).toBe(2)
    expect(stats.totalSalesCents).toBe(24000)
    expect(stats.totalCostCents).toBe(5700)
    expect(stats.profitCents).toBe(18300)
    expect(stats.marginPct).toBeCloseTo(76.25, 5)
    expect(stats.costMissingOrders).toBe(1)

    const americanoRow = stats.perDrink.find((row) => row.name === 'Americano')!
    expect(americanoRow.qty).toBe(2)
    expect(americanoRow.salesCents).toBe(16000)
    expect(americanoRow.costCents).toBe(5700)
    expect(americanoRow.profitCents).toBe(10300)
  })

  it('excludes voided orders from every figure', () => {
    const items = buildOrderItems(
      [{ drinkId: 'coffee-americano', qty: 1 }],
      fixtureDrinks(),
      fixtureIngredients(),
    )
    const stats = computeDayStats([makeOrder(items), makeOrder(items, { voided: true })])
    expect(stats.orderCount).toBe(1)
    expect(stats.totalSalesCents).toBe(8000)
    expect(stats.perDrink).toHaveLength(1)
    expect(stats.perDrink[0]!.qty).toBe(1)
  })

  it('handles an empty day', () => {
    const stats = computeDayStats([])
    expect(stats.orderCount).toBe(0)
    expect(stats.totalSalesCents).toBe(0)
    expect(stats.marginPct).toBeNull()
    expect(stats.perDrink).toEqual([])
  })
})
