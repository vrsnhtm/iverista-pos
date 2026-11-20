import { useState } from 'react'
import type { CartLine, OrderType, Store } from '../types'
import { CATEGORIES } from '../types'
import { formatMoney } from '../lib/money'
import { costPerCupCents } from '../lib/pricing'
import { cartTotals } from '../lib/sales'
import { Flag } from '../components/Badges'

interface SellProps {
  store: Store
  cart: CartLine[]
  orderType: OrderType
  showCost: boolean
  onShowCost: (show: boolean) => void
  onOrderType: (type: OrderType) => void
  onAdd: (drinkId: string) => void
  onQty: (drinkId: string, delta: number) => void
  onRemove: (drinkId: string) => void
  onCheckout: () => void
}

export default function SellScreen({
  store,
  cart,
  orderType,
  showCost,
  onShowCost,
  onOrderType,
  onAdd,
  onQty,
  onRemove,
  onCheckout,
}: SellProps) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Coffee')
  const totals = cartTotals(cart, store.drinks, store.ingredients)
  const drinks = store.drinks.filter((drink) => drink.category === category && drink.active)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              className={`btn min-h-12 px-4 ${category === item ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
          <label className="ml-auto flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-latte bg-foam px-3 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-5 w-5 accent-espresso"
              checked={showCost}
              onChange={(event) => onShowCost(event.target.checked)}
            />
            Show cost/profit
          </label>
        </div>

        {drinks.length === 0 ? (
          <p className="card p-8 text-center text-mocha">
            No active drinks in {category}. Add or activate drinks in Menu &amp; recipes.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {drinks.map((drink) => {
              const canSell = drink.priceCents > 0
              const cost = costPerCupCents(drink, store.ingredients)
              const profit = drink.priceCents - cost
              return (
                <button
                  key={drink.id}
                  className="card flex min-h-28 flex-col justify-between p-3 text-left transition hover:border-caramel hover:shadow-md disabled:opacity-50"
                  disabled={!canSell}
                  onClick={() => onAdd(drink.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-bold leading-tight">{drink.name}</span>
                    {!canSell ? <Flag>needs price</Flag> : null}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <span className="text-xl font-extrabold">{formatMoney(drink.priceCents)}</span>
                    {showCost && canSell ? (
                      <span
                        className={`text-xs font-bold ${profit < 0 ? 'text-danger' : 'text-ok'}`}
                      >
                        profit {formatMoney(profit)}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <aside className="card flex flex-col p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
        <h2 className="text-lg font-extrabold">Cart</h2>

        <div className="min-h-24 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="mt-4 text-sm text-mocha">Tap a drink to start an order.</p>
          ) : (
            <ul>
              {cart.map((line) => {
                const drink = store.drinks.find((d) => d.id === line.drinkId)
                if (!drink) return null
                return (
                  <li
                    key={line.drinkId}
                    className="flex items-center gap-2 border-b border-latte/60 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{drink.name}</div>
                      <div className="text-xs text-mocha">
                        {formatMoney(drink.priceCents)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-secondary w-12 px-0 text-lg"
                        onClick={() => onQty(line.drinkId, -1)}
                        aria-label={`Decrease ${drink.name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-base font-bold">{line.qty}</span>
                      <button
                        className="btn btn-secondary w-12 px-0 text-lg"
                        onClick={() => onQty(line.drinkId, 1)}
                        aria-label={`Increase ${drink.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn btn-ghost w-10 px-0"
                      onClick={() => onRemove(line.drinkId)}
                      aria-label={`Remove ${drink.name}`}
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-3 space-y-1 border-t border-latte pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-mocha">Subtotal</span>
            <span className="font-semibold">{formatMoney(totals.subtotalCents)}</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-base font-bold">Total</span>
            <span className="text-2xl font-black">{formatMoney(totals.totalCents)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className={`btn ${orderType === 'dine-in' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onOrderType('dine-in')}
          >
            Dine-in
          </button>
          <button
            className={`btn ${orderType === 'takeaway' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onOrderType('takeaway')}
          >
            Takeaway
          </button>
        </div>

        <button
          className="btn btn-primary mt-2 min-h-14 text-base"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          Checkout · {formatMoney(totals.totalCents)}
        </button>
      </aside>
    </div>
  )
}
