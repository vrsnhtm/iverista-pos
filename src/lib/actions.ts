import type {
  Category,
  Drink,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '../types'
import { getState, update } from './store'
import { uid } from './id'
import { localDateKey } from './dates'
import { applyStock, nextOrderNumber, type CartTotals } from './sales'
import { seedDrinks } from './seed'

export function addDrink(input: {
  name: string
  category: Category
  priceCents: number
  active: boolean
}): string {
  const id = uid()
  update((s) => ({
    ...s,
    drinks: [...s.drinks, { id, ...input, costLines: [] }],
  }))
  return id
}

export function updateDrink(
  id: string,
  patch: Partial<Pick<Drink, 'name' | 'category' | 'priceCents' | 'active'>>,
): void {
  update((s) => ({
    ...s,
    drinks: s.drinks.map((drink) => (drink.id === id ? { ...drink, ...patch } : drink)),
  }))
}

export function addIngredientLine(drinkId: string, ingredientId: string, qty: number): void {
  update((s) => ({
    ...s,
    drinks: s.drinks.map((drink) =>
      drink.id === drinkId
        ? {
            ...drink,
            costLines: [...drink.costLines, { id: uid(), kind: 'ingredient', ingredientId, qty }],
          }
        : drink,
    ),
  }))
}

export function addCustomLine(drinkId: string, name: string, amountCents: number): void {
  update((s) => ({
    ...s,
    drinks: s.drinks.map((drink) =>
      drink.id === drinkId
        ? {
            ...drink,
            costLines: [...drink.costLines, { id: uid(), kind: 'custom', name, amountCents }],
          }
        : drink,
    ),
  }))
}

export function removeCostLine(drinkId: string, lineId: string): void {
  update((s) => ({
    ...s,
    drinks: s.drinks.map((drink) =>
      drink.id === drinkId
        ? { ...drink, costLines: drink.costLines.filter((line) => line.id !== lineId) }
        : drink,
    ),
  }))
}

export function setIngredientCost(
  id: string,
  purchaseCostCents: number,
  purchaseQty: number,
): void {
  update((s) => ({
    ...s,
    ingredients: s.ingredients.map((ingredient) =>
      ingredient.id === id ? { ...ingredient, purchaseCostCents, purchaseQty } : ingredient,
    ),
  }))
}

export function setReorderLevel(id: string, reorderLevel: number): void {
  update((s) => ({
    ...s,
    ingredients: s.ingredients.map((ingredient) =>
      ingredient.id === id ? { ...ingredient, reorderLevel } : ingredient,
    ),
  }))
}

export function receiveStock(id: string, qty: number): void {
  update((s) => ({
    ...s,
    ingredients: s.ingredients.map((ingredient) =>
      ingredient.id === id
        ? { ...ingredient, onHand: Math.round((ingredient.onHand + qty) * 1000) / 1000 }
        : ingredient,
    ),
  }))
}

/** Restore the seeded menu, discarding entered prices and recipe costs (not orders). */
export function resetToSeedMenu(): void {
  update((s) => ({ ...s, drinks: seedDrinks() }))
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus> = {
  new: 'preparing',
  preparing: 'ready',
  ready: 'done',
  done: 'done',
}

export function advanceOrder(id: string): void {
  update((s) => ({
    ...s,
    orders: s.orders.map((order) =>
      order.id === id && !order.voided
        ? { ...order, status: NEXT_STATUS[order.status] }
        : order,
    ),
  }))
}

export function voidOrder(id: string): void {
  update((s) => {
    const order = s.orders.find((o) => o.id === id)
    if (!order || order.voided) return s
    return {
      ...s,
      ingredients: applyStock(s.ingredients, order.items, 'restore'),
      orders: s.orders.map((o) => (o.id === id ? { ...o, voided: true } : o)),
    }
  })
}

export interface PlaceOrderInput {
  items: OrderItem[]
  type: OrderType
  payment: PaymentMethod
  tenderedCents?: number
  changeCents?: number
  gcashRef?: string
  totals: CartTotals
}

export function placeOrder(input: PlaceOrderInput): Order {
  const current = getState()
  const today = localDateKey()
  const next = nextOrderNumber(current.seqDate, current.seq, today)
  const order: Order = {
    id: uid(),
    number: next.number,
    createdAt: new Date().toISOString(),
    type: input.type,
    payment: input.payment,
    tenderedCents: input.tenderedCents,
    changeCents: input.changeCents,
    gcashRef: input.gcashRef,
    subtotalCents: input.totals.subtotalCents,
    totalCents: input.totals.totalCents,
    totalCostCents: input.totals.totalCostCents,
    profitCents: input.totals.profitCents,
    costMissing: input.totals.costMissing,
    status: 'new',
    voided: false,
    items: input.items,
  }
  update((s) => ({
    ...s,
    orders: [order, ...s.orders],
    seq: next.number,
    seqDate: next.seqDate,
    ingredients: applyStock(s.ingredients, input.items, 'deduct'),
  }))
  return order
}

/**
 * Delete every order recorded on a local calendar day. If that day is today the
 * daily order counter resets; stock and menu history stay untouched.
 */
export function clearDay(dateKey: string): void {
  update((s) => {
    const orders = s.orders.filter(
      (order) => localDateKey(new Date(order.createdAt)) !== dateKey,
    )
    const isToday = dateKey === localDateKey()
    return {
      ...s,
      orders,
      seq: isToday ? 0 : s.seq,
      seqDate: isToday ? null : s.seqDate,
    }
  })
}
