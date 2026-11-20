import type { Order } from '../types'
import { localDateKey } from './dates'
import {
  daysInMonth,
  formatDateLabel,
  formatDayShort,
  formatMonthLabel,
  formatMonthShort,
  formatYearLabel,
} from './calendar'

export type Period = 'day' | 'month' | 'year'

export const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
]

/** Local calendar day an order was created on. */
export function orderDateKey(order: Order): string {
  return localDateKey(new Date(order.createdAt))
}

export function ordersForPeriod(orders: Order[], period: Period, anchor: string): Order[] {
  if (period === 'day') return orders.filter((order) => orderDateKey(order) === anchor)
  if (period === 'month') {
    const prefix = anchor.slice(0, 7)
    return orders.filter((order) => orderDateKey(order).startsWith(prefix))
  }
  const prefix = anchor.slice(0, 4)
  return orders.filter((order) => orderDateKey(order).startsWith(prefix))
}

export function periodLabel(period: Period, anchor: string): string {
  if (period === 'day') return formatDateLabel(anchor)
  if (period === 'month') return formatMonthLabel(anchor)
  return formatYearLabel(anchor)
}

export interface SalesBucket {
  key: string
  label: string
  orderCount: number
  salesCents: number
  costCents: number
  profitCents: number
}

function bucketFor(orders: Order[], key: string, label: string): SalesBucket {
  let salesCents = 0
  let costCents = 0
  let orderCount = 0
  for (const order of orders) {
    if (order.voided) continue
    salesCents += order.totalCents
    costCents += order.totalCostCents
    orderCount += 1
  }
  return {
    key,
    label,
    orderCount,
    salesCents,
    costCents,
    profitCents: salesCents - costCents,
  }
}

/** Every day of the anchor's month, zero-filled, voids excluded. */
export function dailyBuckets(orders: Order[], anchor: string): SalesBucket[] {
  const prefix = anchor.slice(0, 7)
  const live = orders.filter((order) => !order.voided && orderDateKey(order).startsWith(prefix))
  const total = daysInMonth(anchor)
  return Array.from({ length: total }, (_, index) => {
    const key = `${prefix}-${String(index + 1).padStart(2, '0')}`
    const dayOrders = live.filter((order) => orderDateKey(order) === key)
    return bucketFor(dayOrders, key, formatDayShort(key))
  })
}

/** All twelve months of the anchor's year, zero-filled, voids excluded. */
export function monthlyBuckets(orders: Order[], anchor: string): SalesBucket[] {
  const year = anchor.slice(0, 4)
  const live = orders.filter((order) => !order.voided && orderDateKey(order).startsWith(year))
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0')
    const key = `${year}-${month}-01`
    const monthOrders = live.filter((order) => orderDateKey(order).slice(0, 7) === `${year}-${month}`)
    return bucketFor(monthOrders, key, formatMonthShort(key))
  })
}
