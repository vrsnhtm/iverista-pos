import { describe, expect, it } from 'vitest'
import type { Drink } from '../types'
import { costPerCupCents, drinkMargin, ingredientUnitCost, lineCostCents, marginLabel, needsCost, needsPrice, profitPerCupCents } from './pricing'
import { AMERICANO_COST_CENTS, AMERICANO_PROFIT_CENTS, fixtureAmericano, fixtureIngredients } from './fixtures'

describe('pricing', () => {
  it('computes an ingredient line from purchase cost and purchase quantity', () => {
    const ingredients = fixtureIngredients()
    const american = fixtureAmericano()
    const bean = ingredients[0]!
    expect(ingredientUnitCost(bean)).toBe(100)
    expect(lineCostCents(american.costLines[0]!, ingredients)).toBe(1800)
    expect(lineCostCents(american.costLines[1]!, ingredients)).toBe(400)
    expect(lineCostCents(american.costLines[2]!, ingredients)).toBe(300)
  })

  it('sums cost lines, custom lines included', () => {
    const cost = costPerCupCents(fixtureAmericano(), fixtureIngredients())
    expect(cost).toBe(AMERICANO_COST_CENTS)
  })

  it('computes profit and margin for the Americano fixture', () => {
    const drink = fixtureAmericano()
    const ingredients = fixtureIngredients()
    expect(profitPerCupCents(drink, ingredients)).toBe(AMERICANO_PROFIT_CENTS)
    expect(drinkMargin(drink, ingredients)).toBeCloseTo(64.375, 5)
    expect(marginLabel(drinkMargin(drink, ingredients))).toBe('64.4%')
  })

  it('shows negative profit when cost exceeds price', () => {
    const drink: Drink = {
      ...fixtureAmericano(),
      priceCents: 2000,
    }
    expect(profitPerCupCents(drink, fixtureIngredients())).toBe(-850)
    expect(drinkMargin(drink, fixtureIngredients())).toBeLessThan(0)
  })

  it('rounds once per line, not on the unit cost', () => {
    const ingredients = [
      {
        id: 'odd',
        name: 'odd',
        unit: 'g',
        purchaseCostCents: 100,
        purchaseQty: 3,
        onHand: 0,
        reorderLevel: 0,
      },
    ]
    const drink: Drink = {
      id: 'd',
      name: 'D',
      category: 'Coffee',
      priceCents: 1000,
      active: true,
      costLines: [
        { id: 'a', kind: 'ingredient', ingredientId: 'odd', qty: 1 },
        { id: 'b', kind: 'ingredient', ingredientId: 'odd', qty: 1 },
      ],
    }
    expect(costPerCupCents(drink, ingredients)).toBe(66)
  })

  it('flags drinks without a price and without cost lines', () => {
    const drink: Drink = {
      id: 'x',
      name: 'Vietnamese Coffee',
      category: 'Coffee',
      priceCents: 0,
      active: false,
      costLines: [],
    }
    expect(needsPrice(drink)).toBe(true)
    expect(needsCost(drink)).toBe(true)
    expect(drinkMargin(drink, [])).toBeNull()
    expect(marginLabel(null)).toBe('—')

    const withLines: Drink = { ...drink, priceCents: 8000, costLines: fixtureAmericano().costLines }
    expect(needsPrice(withLines)).toBe(false)
    expect(needsCost(withLines)).toBe(false)
  })

  it('treats an ingredient with no purchase data as zero cost', () => {
    const ingredients = fixtureIngredients()
    const unpriced = ingredients.map((i) => ({ ...i, purchaseCostCents: 0, purchaseQty: 0 }))
    expect(costPerCupCents(fixtureAmericano(), unpriced)).toBe(350)
  })
})
