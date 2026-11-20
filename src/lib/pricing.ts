import type { CostLine, Drink, Ingredient } from '../types'

/** Exact unit cost in centavos (purchase cost / purchase quantity). */
export function ingredientUnitCost(ingredient: Ingredient): number {
  if (!Number.isFinite(ingredient.purchaseQty) || ingredient.purchaseQty <= 0) return 0
  return ingredient.purchaseCostCents / ingredient.purchaseQty
}

/** A line is rounded once, after quantity x unit cost. */
export function lineCostCents(line: CostLine, ingredients: Ingredient[]): number {
  if (line.kind === 'custom') return Math.round(line.amountCents)
  const ingredient = ingredients.find((i) => i.id === line.ingredientId)
  if (!ingredient) return 0
  if (!Number.isFinite(line.qty) || line.qty <= 0) return 0
  return Math.round(line.qty * ingredientUnitCost(ingredient))
}

export function costPerCupCents(drink: Drink, ingredients: Ingredient[]): number {
  return drink.costLines.reduce((sum, line) => sum + lineCostCents(line, ingredients), 0)
}

/** A drink needs a price when it has none yet (seeded as 0) or has been zeroed. */
export function needsPrice(drink: Drink): boolean {
  return drink.priceCents <= 0
}

/** A drink needs a cost until it has at least one cost line. */
export function needsCost(drink: Drink): boolean {
  return drink.costLines.length === 0
}

export function profitPerCupCents(drink: Drink, ingredients: Ingredient[]): number {
  return drink.priceCents - costPerCupCents(drink, ingredients)
}

/** Margin as a percentage of price. Null when there is no price yet. */
export function marginPercent(priceCents: number, profitCents: number): number | null {
  if (priceCents <= 0) return null
  return (profitCents / priceCents) * 100
}

export function drinkMargin(drink: Drink, ingredients: Ingredient[]): number | null {
  return marginPercent(drink.priceCents, profitPerCupCents(drink, ingredients))
}

export function marginLabel(percent: number | null): string {
  return percent === null ? '—' : `${percent.toFixed(1)}%`
}
