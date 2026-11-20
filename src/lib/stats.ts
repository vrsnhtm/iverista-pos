import type { Order } from '../types'
import { marginPercent } from './pricing'

export interface PerDrinkStat {
  drinkId: string
  name: string
  qty: number
  salesCents: number
  costCents: number
  profitCents: number
}

export interface DayStats {
  orderCount: number
  totalSalesCents: number
  totalCostCents: number
  profitCents: number
  marginPct: number | null
  perDrink: PerDrinkStat[]
  costMissingOrders: number
}

export function computeDayStats(orders: Order[]): DayStats {
  const live = orders.filter((order) => !order.voided)
  const perDrinkMap = new Map<string, PerDrinkStat>()

  for (const order of live) {
    for (const item of order.items) {
      const key = item.drinkId + '|' + item.name
      const existing = perDrinkMap.get(key)
      if (existing) {
        existing.qty += item.qty
        existing.salesCents += item.lineSalesCents
        existing.costCents += item.lineCostCents
        existing.profitCents += item.lineProfitCents
      } else {
        perDrinkMap.set(key, {
          drinkId: item.drinkId,
          name: item.name,
          qty: item.qty,
          salesCents: item.lineSalesCents,
          costCents: item.lineCostCents,
          profitCents: item.lineProfitCents,
        })
      }
    }
  }

  const totalSalesCents = live.reduce((sum, o) => sum + o.totalCents, 0)
  const totalCostCents = live.reduce((sum, o) => sum + o.totalCostCents, 0)
  const profitCents = totalSalesCents - totalCostCents

  return {
    orderCount: live.length,
    totalSalesCents,
    totalCostCents,
    profitCents,
    marginPct: marginPercent(totalSalesCents, profitCents),
    perDrink: [...perDrinkMap.values()].sort((a, b) => b.salesCents - a.salesCents),
    costMissingOrders: live.filter((o) => o.costMissing).length,
  }
}
