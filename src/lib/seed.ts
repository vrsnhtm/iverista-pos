import type { Category, Drink, Ingredient, Store } from '../types'

interface SeedDrink {
  name: string
  category: Category
  priceCents: number
  active: boolean
}

interface SeedIngredient {
  name: string
  unit: string
}

const COFFEE: SeedDrink[] = [
  { name: 'Americano', category: 'Coffee', priceCents: 8000, active: true },
  { name: 'Long Black', category: 'Coffee', priceCents: 8000, active: true },
  { name: 'Sweet Black', category: 'Coffee', priceCents: 9000, active: true },
  { name: 'Spanish Latte', category: 'Coffee', priceCents: 10000, active: true },
  { name: 'Mocha', category: 'Coffee', priceCents: 11000, active: true },
  { name: 'Caramel Macchiato', category: 'Coffee', priceCents: 11000, active: true },
  { name: 'Salted Caramel', category: 'Coffee', priceCents: 11000, active: true },
  { name: 'French Vanilla', category: 'Coffee', priceCents: 11000, active: true },
  { name: 'Sea Salt Latte', category: 'Coffee', priceCents: 11000, active: true },
  { name: 'White Chocolate Mocha', category: 'Coffee', priceCents: 11000, active: true },
  // No price yet: seeded inactive and flagged.
  { name: 'Vietnamese Coffee', category: 'Coffee', priceCents: 0, active: false },
]

const SODA: SeedDrink[] = [
  { name: 'Blueberry', category: 'Soda', priceCents: 6000, active: true },
  { name: 'Strawberry', category: 'Soda', priceCents: 6000, active: true },
  { name: 'Green Apple', category: 'Soda', priceCents: 6000, active: true },
  { name: 'Lychee', category: 'Soda', priceCents: 6000, active: true },
]

const NON_COFFEE: SeedDrink[] = [
  { name: 'Ice Chocolate', category: 'Non-coffee', priceCents: 0, active: false },
  { name: 'Matcha Latte', category: 'Non-coffee', priceCents: 0, active: false },
  { name: 'Strawberry Latte', category: 'Non-coffee', priceCents: 0, active: false },
  { name: 'Blueberry Latte', category: 'Non-coffee', priceCents: 0, active: false },
  { name: 'Green Apple Latte', category: 'Non-coffee', priceCents: 0, active: false },
]

const FRUIT: SeedDrink[] = [
  { name: 'Blueberry', category: 'Fruit', priceCents: 0, active: false },
  { name: 'Strawberry', category: 'Fruit', priceCents: 0, active: false },
  { name: 'Green Apple', category: 'Fruit', priceCents: 0, active: false },
  { name: 'Lychee', category: 'Fruit', priceCents: 0, active: false },
]

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const ADD_ONS: SeedDrink[] = [
  { name: 'Espresso Shot', category: 'Add-ons', priceCents: 3000, active: true },
  { name: 'French Vanilla Syrup', category: 'Add-ons', priceCents: 2000, active: true },
  { name: 'Caramel Syrup', category: 'Add-ons', priceCents: 2000, active: true },
  { name: 'White Chocolate Syrup', category: 'Add-ons', priceCents: 2000, active: true },
  { name: 'Salted Caramel Syrup', category: 'Add-ons', priceCents: 2000, active: true },
  { name: 'Sea Salt Foam', category: 'Add-ons', priceCents: 2000, active: true },
]

const SEED_DRINKS = [...COFFEE, ...SODA, ...NON_COFFEE, ...FRUIT, ...ADD_ONS]

const SEED_INGREDIENTS: SeedIngredient[] = [
  { name: 'coffee bean', unit: 'g' },
  { name: 'fresh milk', unit: 'ml' },
  { name: 'Nestle cream', unit: 'ml' },
  { name: 'condensed milk', unit: 'ml' },
  { name: 'evaporated milk', unit: 'ml' },
  { name: 'caramel syrup', unit: 'ml' },
  { name: 'vanilla syrup', unit: 'ml' },
  { name: 'sugar syrup', unit: 'ml' },
  { name: 'white chocolate syrup', unit: 'ml' },
  { name: 'cocoa powder', unit: 'g' },
  { name: 'iodized salt', unit: 'g' },
  { name: 'fruit syrup', unit: 'ml' },
  { name: 'Sprite', unit: 'ml' },
  { name: 'tube ice', unit: 'pc' },
  { name: 'cup', unit: 'pc' },
  { name: 'lid', unit: 'pc' },
  { name: 'straw', unit: 'pc' },
  { name: 'water', unit: 'ml' },
]

export function seedDrinks(): Drink[] {
  return SEED_DRINKS.map((drink) => ({
    id: `${drink.category.toLowerCase().replace(/[^a-z]+/g, '-')}-${slug(drink.name)}`,
    name: drink.name,
    category: drink.category,
    priceCents: drink.priceCents,
    active: drink.active,
    costLines: [],
  }))
}

export function seedIngredients(): Ingredient[] {
  return SEED_INGREDIENTS.map((item) => ({
    id: slug(item.name),
    name: item.name,
    unit: item.unit,
    purchaseCostCents: 0,
    purchaseQty: 0,
    onHand: 0,
    reorderLevel: 0,
  }))
}

export function seedStore(): Store {
  return {
    version: 1,
    drinks: seedDrinks(),
    ingredients: seedIngredients(),
    orders: [],
    seqDate: null,
    seq: 0,
  }
}
