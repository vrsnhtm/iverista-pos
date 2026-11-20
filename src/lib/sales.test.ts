import { describe, expect, it } from 'vitest'
import { applyStock, buildOrderItems, cartTotals, nextOrderNumber, stockUseFor, summarizeItems } from './sales'
import { fixtureAmericano, fixtureDrinks, fixtureIngredients } from './fixtures'

describe('sales', () => {
  it('totals a cart', () => {
    const totals = cartTotals(
      [{ drinkId: 'coffee-americano', qty: 2 }],
      fixtureDrinks(),
      fixtureIngredients(),
    )
    expect(totals.totalQty).toBe(2)
    expect(totals.subtotalCents).toBe(16000)
    expect(totals.totalCents).toBe(16000)
    expect(totals.totalCostCents).toBe(5700)
    expect(totals.profitCents).toBe(10300)
    expect(totals.costMissing).toBe(false)
  })

  it('snapshots price, unit cost and profit at sale time', () => {
    const drinks = fixtureDrinks()
    const ingredients = fixtureIngredients()
    const items = buildOrderItems([{ drinkId: 'coffee-americano', qty: 2 }], drinks, ingredients)
    expect(items).toHaveLength(1)
    expect(items[0]!.unitPriceCents).toBe(8000)
    expect(items[0]!.unitCostCents).toBe(2850)
    expect(items[0]!.lineCostCents).toBe(5700)
    expect(items[0]!.lineProfitCents).toBe(10300)

    // Later cost edits must not change the frozen order item.
    ingredients[0]!.purchaseCostCents = 999999
    ingredients[0]!.onHand = 0
    expect(items[0]!.unitCostCents).toBe(2850)
    expect(items[0]!.lineProfitCents).toBe(10300)
  })

  it('flags a drink with no cost lines as cost missing but still sells it', () => {
    const totals = cartTotals(
      [{ drinkId: 'coffee-long-black', qty: 1 }],
      fixtureDrinks(),
      fixtureIngredients(),
    )
    expect(totals.costMissing).toBe(true)
    expect(totals.totalCents).toBe(8000)
    expect(totals.totalCostCents).toBe(0)
    expect(totals.profitCents).toBe(8000)
  })

  it('deducts ingredient quantities on sale and restores them on void', () => {
    const ingredients = fixtureIngredients()
    const items = buildOrderItems(
      [{ drinkId: 'coffee-americano', qty: 2 }],
      fixtureDrinks(),
      ingredients,
    )
    const afterSale = applyStock(ingredients, items, 'deduct')
    expect(afterSale.find((i) => i.id === 'coffee-bean')!.onHand).toBe(4964)
    expect(afterSale.find((i) => i.id === 'water')!.onHand).toBe(19840)
    expect(afterSale.find((i) => i.id === 'tube-ice')!.onHand).toBe(98)
    // Custom lines never touch stock.
    expect(afterSale.find((i) => i.id === 'fresh-milk')!.onHand).toBe(2000)

    const afterVoid = applyStock(afterSale, items, 'restore')
    expect(afterVoid.find((i) => i.id === 'coffee-bean')!.onHand).toBe(5000)
    expect(afterVoid.find((i) => i.id === 'water')!.onHand).toBe(20000)
    expect(afterVoid.find((i) => i.id === 'tube-ice')!.onHand).toBe(100)
  })

  it('lets stock go negative when a sale is short', () => {
    const ingredients = fixtureIngredients().map((i) =>
      i.id === 'coffee-bean' ? { ...i, onHand: 0 } : i,
    )
    const items = buildOrderItems(
      [{ drinkId: 'coffee-americano', qty: 1 }],
      fixtureDrinks(),
      ingredients,
    )
    const afterSale = applyStock(ingredients, items, 'deduct')
    expect(afterSale.find((i) => i.id === 'coffee-bean')!.onHand).toBe(-18)
  })

  it('aggregates repeated ingredient lines once per drink', () => {
    const drink = fixtureAmericano()
    drink.costLines.push({ id: 'extra-bean', kind: 'ingredient', ingredientId: 'coffee-bean', qty: 2 })
    expect(stockUseFor(drink)).toEqual([
      { ingredientId: 'coffee-bean', qty: 20 },
      { ingredientId: 'water', qty: 80 },
      { ingredientId: 'tube-ice', qty: 1 },
    ])
  })

  it('resets order numbers each day', () => {
    expect(nextOrderNumber(null, 0, '2026-11-12')).toEqual({ number: 1, seqDate: '2026-11-12' })
    expect(nextOrderNumber('2026-11-12', 4, '2026-11-12')).toEqual({
      number: 5,
      seqDate: '2026-11-12',
    })
    expect(nextOrderNumber('2026-11-11', 9, '2026-11-12')).toEqual({
      number: 1,
      seqDate: '2026-11-12',
    })
  })

  it('summarizes frozen items', () => {
    const items = buildOrderItems(
      [
        { drinkId: 'coffee-americano', qty: 1 },
        { drinkId: 'coffee-long-black', qty: 2 },
      ],
      fixtureDrinks(),
      fixtureIngredients(),
    )
    const totals = summarizeItems(items)
    expect(totals.totalQty).toBe(3)
    expect(totals.totalCents).toBe(24000)
    expect(totals.costMissing).toBe(true)
  })
})
