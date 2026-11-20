export type Category = 'Coffee' | 'Soda' | 'Non-coffee' | 'Fruit'

export const CATEGORIES: Category[] = ['Coffee', 'Soda', 'Non-coffee', 'Fruit']

export type OrderType = 'dine-in' | 'takeaway'
export type PaymentMethod = 'cash' | 'gcash'
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'done'

export interface Ingredient {
  id: string
  name: string
  unit: string
  /** Purchase price in centavos (0 until the owner enters it). */
  purchaseCostCents: number
  /** How many units that purchase price buys (0 until the owner enters it). */
  purchaseQty: number
  onHand: number
  reorderLevel: number
}

export interface IngredientLine {
  id: string
  kind: 'ingredient'
  ingredientId: string
  qty: number
}

export interface CustomLine {
  id: string
  kind: 'custom'
  name: string
  amountCents: number
}

export type CostLine = IngredientLine | CustomLine

export interface Drink {
  id: string
  name: string
  category: Category
  priceCents: number
  active: boolean
  costLines: CostLine[]
}

export interface StockUse {
  ingredientId: string
  qty: number
}

/** Snapshot of one sold drink. Values are frozen at sale time. */
export interface OrderItem {
  drinkId: string
  name: string
  qty: number
  unitPriceCents: number
  unitCostCents: number
  lineSalesCents: number
  lineCostCents: number
  lineProfitCents: number
  costMissing: boolean
  /** Ingredient quantities used, kept so a void can restore stock exactly. */
  stockUse: StockUse[]
}

export interface Order {
  id: string
  number: number
  createdAt: string
  type: OrderType
  payment: PaymentMethod
  tenderedCents?: number
  changeCents?: number
  gcashRef?: string
  subtotalCents: number
  totalCents: number
  totalCostCents: number
  profitCents: number
  costMissing: boolean
  status: OrderStatus
  voided: boolean
  items: OrderItem[]
}

export interface Store {
  version: 1
  drinks: Drink[]
  ingredients: Ingredient[]
  orders: Order[]
  /** Local date key (YYYY-MM-DD) that seq belongs to. */
  seqDate: string | null
  seq: number
}

export interface CartLine {
  drinkId: string
  qty: number
}
