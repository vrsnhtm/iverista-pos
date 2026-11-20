import { useMemo, useState } from 'react'
import type { CartLine, Order, OrderType, PaymentMethod, Store } from '../types'
import { buildOrderItems, summarizeItems } from '../lib/sales'
import { changeFor, formatMoney, pesosToCents } from '../lib/money'
import { placeOrder } from '../lib/actions'
import { Flag } from '../components/Badges'

interface CheckoutProps {
  store: Store
  cart: CartLine[]
  orderType: OrderType
  onBack: () => void
  onComplete: (order: Order) => void
}

const QUICK_CASH_PESOS = [50, 100, 200, 500, 1000, 2000]

export default function CheckoutScreen({
  store,
  cart,
  orderType,
  onBack,
  onComplete,
}: CheckoutProps) {
  const items = useMemo(
    () => buildOrderItems(cart, store.drinks, store.ingredients),
    [cart, store.drinks, store.ingredients],
  )
  const totals = useMemo(() => summarizeItems(items), [items])

  const [payment, setPayment] = useState<PaymentMethod>('cash')
  const [tenderedText, setTenderedText] = useState('')
  const [reference, setReference] = useState('')

  const tenderedCents = pesosToCents(tenderedText) ?? 0
  const change = changeFor(tenderedCents, totals.totalCents)
  const cashReady = tenderedText.trim() !== '' && change.ok
  const gcashReady = reference.trim().length >= 4
  const canComplete =
    items.length > 0 && (payment === 'cash' ? cashReady : gcashReady)

  const quickCash = QUICK_CASH_PESOS.map((pesos) => pesos * 100).filter(
    (cents) => cents >= totals.totalCents,
  )

  function complete() {
    if (!canComplete) return
    const order = placeOrder({
      items,
      type: orderType,
      payment,
      tenderedCents: payment === 'cash' ? tenderedCents : undefined,
      changeCents: payment === 'cash' ? change.changeCents : undefined,
      gcashRef: payment === 'gcash' ? reference.trim() : undefined,
      totals,
    })
    onComplete(order)
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-mocha">The cart is empty.</p>
        <button className="btn btn-primary mt-4" onClick={onBack}>
          Back to Sell
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">Checkout</h1>
          <p className="text-sm text-mocha">
            {orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'} · {totals.totalQty} item
            {totals.totalQty === 1 ? '' : 's'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to cart
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="card p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`btn ${payment === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPayment('cash')}
            >
              Cash
            </button>
            <button
              className={`btn ${payment === 'gcash' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPayment('gcash')}
            >
              GCash
            </button>
          </div>

          {payment === 'cash' ? (
            <div className="mt-4">
              <label className="label" htmlFor="tendered">
                Amount tendered (₱)
              </label>
              <input
                id="tendered"
                className="input text-2xl font-bold"
                inputMode="decimal"
                placeholder="0.00"
                value={tenderedText}
                onChange={(event) => setTenderedText(event.target.value)}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => setTenderedText((totals.totalCents / 100).toString())}
                >
                  Exact
                </button>
                {quickCash.slice(0, 4).map((cents) => (
                  <button
                    key={cents}
                    className="btn btn-secondary"
                    onClick={() => setTenderedText((cents / 100).toString())}
                  >
                    {formatMoney(cents)}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-cream p-3">
                {tenderedText.trim() === '' ? (
                  <p className="text-sm text-mocha">Enter the cash received.</p>
                ) : change.ok ? (
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">Change</span>
                    <span className="text-2xl font-black">{formatMoney(change.changeCents)}</span>
                  </div>
                ) : (
                  <p className="font-semibold text-danger">
                    Short {formatMoney(change.shortCents)} — cash must cover the total.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <label className="label" htmlFor="gcash-ref">
                GCash reference number
              </label>
              <input
                id="gcash-ref"
                className="input"
                placeholder="e.g. 1234567890"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
              <p className="mt-2 text-sm text-mocha">
                Confirm the GCash payment on your phone first, then enter its reference number.
              </p>
              {reference.trim() !== '' && !gcashReady ? (
                <p className="mt-2 text-sm font-semibold text-danger">
                  Enter at least 4 characters of the reference number.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <aside className="card self-start p-4">
          <h2 className="text-lg font-extrabold">Order summary</h2>
          <ul className="mt-2 divide-y divide-latte/60">
            {items.map((item) => (
              <li key={item.drinkId} className="flex justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-semibold">{item.qty}×</span> {item.name}
                  {item.costMissing ? (
                    <span className="ml-2">
                      <Flag tone="danger">cost missing</Flag>
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold">{formatMoney(item.lineSalesCents)}</span>
              </li>
            ))}
          </ul>

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

          <button
            className="btn btn-primary mt-4 min-h-14 w-full text-base"
            disabled={!canComplete}
            onClick={complete}
          >
            Complete sale
          </button>
          <p className="mt-2 text-xs text-mocha">
            The receipt opens next, with a print button.
          </p>
        </aside>
      </div>
    </div>
  )
}
