import type { Drink, Ingredient } from '../types'

/** Test-only example numbers. The app never hard-codes these. */
export const AMERICANO_COST_CENTS = 2850
export const AMERICANO_PROFIT_CENTS = 5150

export function fixtureIngredients(): Ingredient[] {
  return [
    // ₱1,000.00 per 1,000 g => 100 centavos per gram
    {
      id: 'coffee-bean',
      name: 'coffee bean',
      unit: 'g',
      purchaseCostCents: 100000,
      purchaseQty: 1000,
      onHand: 5000,
      reorderLevel: 500,
    },
    // ₱50.00 per 1,000 ml => 5 centavos per ml
    {
      id: 'water',
      name: 'water',
      unit: 'ml',
      purchaseCostCents: 5000,
      purchaseQty: 1000,
      onHand: 20000,
      reorderLevel: 2000,
    },
    // ₱3.00 per piece
    {
      id: 'tube-ice',
      name: 'tube ice',
      unit: 'pc',
      purchaseCostCents: 300,
      purchaseQty: 1,
      onHand: 100,
      reorderLevel: 20,
    },
    {
      id: 'fresh-milk',
      name: 'fresh milk',
      unit: 'ml',
      purchaseCostCents: 12000,
      purchaseQty: 1000,
      onHand: 2000,
      reorderLevel: 500,
    },
  ]
}

/** Americano: bean 18 + water 4 + ice 3 + cup 2 + lid 1 + straw 0.5 = 28.50 */
export function fixtureAmericano(): Drink {
  return {
    id: 'coffee-americano',
    name: 'Americano',
    category: 'Coffee',
    priceCents: 8000,
    active: true,
    costLines: [
      { id: 'line-bean', kind: 'ingredient', ingredientId: 'coffee-bean', qty: 18 },
      { id: 'line-water', kind: 'ingredient', ingredientId: 'water', qty: 80 },
      { id: 'line-ice', kind: 'ingredient', ingredientId: 'tube-ice', qty: 1 },
      { id: 'line-cup', kind: 'custom', name: 'cup', amountCents: 200 },
      { id: 'line-lid', kind: 'custom', name: 'lid', amountCents: 100 },
      { id: 'line-straw', kind: 'custom', name: 'straw', amountCents: 50 },
    ],
  }
}

export function fixtureLongBlack(): Drink {
  return {
    id: 'coffee-long-black',
    name: 'Long Black',
    category: 'Coffee',
    priceCents: 8000,
    active: true,
    costLines: [],
  }
}

export function fixtureDrinks(): Drink[] {
  return [fixtureAmericano(), fixtureLongBlack()]
}
