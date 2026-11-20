import type { CartLine, Drink, Ingredient, OrderItem, StockUse } from '../types'
import { costPerCupCents } from './pricing'

/** Ingredient quantities one cup of a drink uses (custom lines never touch stock). */
export function stockUseFor(drink: Drink): StockUse[] {
  const totals = new Map<string, number>()
  for (const line of drink.costLines) {
    if (line.kind !== 'ingredient') continue
    totals.set(line.ingredientId, (totals.get(line.ingredientId) ?? 0) + line.qty)
  }
  return [...totals.entries()].map(([ingredientId, qty]) => ({ ingredientId, qty }))
}

/**
 * Turn cart lines into frozen order items. Price, unit cost and profit are
 * captured here so later cost or recipe edits never change a past sale.
 */
export function buildOrderItems(
  cart: CartLine[],
  drinks: Drink[],
  ingredients: Ingredient[],
): OrderItem[] {
  const items: OrderItem[] = []
  for (const line of cart) {
    if (line.qty <= 0) continue
    const drink = drinks.find((d) => d.id === line.drinkId)
    if (!drink) continue
    const unitCostCents = costPerCupCents(drink, ingredients)
    const lineSalesCents = drink.priceCents * line.qty
    const lineCostCents = unitCostCents * line.qty
    items.push({
      drinkId: drink.id,
      name: drink.name,
      qty: line.qty,
      unitPriceCents: drink.priceCents,
      unitCostCents,
      lineSalesCents,
      lineCostCents,
      lineProfitCents: lineSalesCents - lineCostCents,
      costMissing: drink.costLines.length === 0,
      stockUse: stockUseFor(drink),
    })
  }
  return items
}

export interface CartTotals {
  totalQty: number
  subtotalCents: number
  totalCents: number
  totalCostCents: number
  profitCents: number
  costMissing: boolean
}

export function summarizeItems(items: OrderItem[]): CartTotals {
  const subtotalCents = items.reduce((sum, i) => sum + i.lineSalesCents, 0)
  const totalCostCents = items.reduce((sum, i) => sum + i.lineCostCents, 0)
  return {
    totalQty: items.reduce((sum, i) => sum + i.qty, 0),
    subtotalCents,
    totalCents: subtotalCents,
    totalCostCents,
    profitCents: subtotalCents - totalCostCents,
    costMissing: items.some((i) => i.costMissing),
  }
}

export function cartTotals(
  cart: CartLine[],
  drinks: Drink[],
  ingredients: Ingredient[],
): CartTotals {
  return summarizeItems(buildOrderItems(cart, drinks, ingredients))
}

function roundStock(value: number): number {
  return Math.round(value * 1000) / 1000
}

/**
 * Deduct (sale) or restore (void) the ingredient quantities in an order.
 * Stock is allowed to go negative; the UI flags it rather than blocking a sale.
 */
export function applyStock(
  ingredients: Ingredient[],
  items: OrderItem[],
  mode: 'deduct' | 'restore',
): Ingredient[] {
  const used = new Map<string, number>()
  for (const item of items) {
    for (const use of item.stockUse) {
      used.set(use.ingredientId, (used.get(use.ingredientId) ?? 0) + use.qty * item.qty)
    }
  }
  return ingredients.map((ingredient) => {
    const qty = used.get(ingredient.id)
    if (qty === undefined) return ingredient
    return {
      ...ingredient,
      onHand: roundStock(ingredient.onHand + (mode === 'deduct' ? -qty : qty)),
    }
  })
}

/** Next daily order number: resets when the local day changes. */
export function nextOrderNumber(
  seqDate: string | null,
  seq: number,
  today: string,
): { number: number; seqDate: string } {
  if (seqDate === today) return { number: seq + 1, seqDate: today }
  return { number: 1, seqDate: today }
}
