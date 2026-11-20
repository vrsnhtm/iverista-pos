import { useState } from 'react'
import type { Order, OrderStatus, Store } from '../types'
import { advanceOrder, voidOrder } from '../lib/actions'
import { formatTime, localDateKey, orderNumberLabel } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { ConfirmDialog } from '../components/Modal'

const COLUMNS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'new', label: 'New', hint: 'Tap to start preparing' },
  { status: 'preparing', label: 'Preparing', hint: 'Tap when ready' },
  { status: 'ready', label: 'Ready', hint: 'Tap when handed over' },
  { status: 'done', label: 'Done', hint: 'Completed orders' },
]

function itemsSummary(order: Order): string {
  return order.items.map((item) => `${item.qty}× ${item.name}`).join(' · ')
}

export default function QueueScreen({ store }: { store: Store }) {
  const [voidId, setVoidId] = useState<string | null>(null)
  const voiding = store.orders.find((order) => order.id === voidId) ?? null
  const today = localDateKey()
  const orders = store.orders
    .filter(
      (order) => !order.voided && localDateKey(new Date(order.createdAt)) === today,
    )
    .sort((a, b) => a.number - b.number)

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-black">Queue</h1>
        <p className="text-sm text-mocha">Tap a ticket to move it forward: New → Preparing → Ready → Done.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter((order) => order.status === column.status)
          return (
            <section key={column.status} className="flex min-h-40 flex-col rounded-2xl bg-latte/30 p-2">
              <header className="flex items-baseline justify-between px-2 py-1">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-mocha">
                  {column.label}
                </h2>
                <span className="badge bg-foam text-mocha">{columnOrders.length}</span>
              </header>
              <p className="px-2 pb-2 text-[11px] text-mocha/80">{column.hint}</p>
              <div className="flex flex-1 flex-col gap-2">
                {columnOrders.map((order) => (
                  <article key={order.id} className="card overflow-hidden">
                    <button
                      className="w-full p-3 text-left transition hover:bg-latte/20 disabled:opacity-60"
                      onClick={() => advanceOrder(order.id)}
                      disabled={order.status === 'done'}
                      aria-label={`Advance order ${orderNumberLabel(order.number)} from ${column.label}`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-black">
                          {orderNumberLabel(order.number)}
                        </span>
                        <span className="text-xs font-semibold uppercase text-mocha">
                          {order.type === 'dine-in' ? 'Dine-in' : 'Takeaway'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm leading-snug">{itemsSummary(order)}</div>
                      <div className="mt-2 flex items-baseline justify-between text-xs text-mocha">
                        <span>{formatTime(order.createdAt)}</span>
                        <span className="font-semibold">{formatMoney(order.totalCents)}</span>
                      </div>
                    </button>
                    <div className="flex justify-end border-t border-latte/60 px-2 py-1">
                      <button
                        className="btn btn-danger px-3 text-xs"
                        onClick={() => setVoidId(order.id)}
                        aria-label={`Void order ${orderNumberLabel(order.number)}`}
                      >
                        Void
                      </button>
                    </div>
                  </article>
                ))}
                {columnOrders.length === 0 ? (
                  <p className="px-2 py-4 text-xs text-mocha/70">Empty</p>
                ) : null}
              </div>
            </section>
          )
        })}
      </div>

      <ConfirmDialog
        open={voidId !== null}
        title={`Void order ${voiding ? orderNumberLabel(voiding.number) : ''}?`}
        message="Use this when the wrong ticket was opened. The order leaves the queue and is excluded from sales, cost and profit. Ingredient stock is restored."
        confirmLabel="Void order"
        destructive
        onCancel={() => setVoidId(null)}
        onConfirm={() => {
          if (voidId) voidOrder(voidId)
          setVoidId(null)
        }}
      />
    </div>
  )
}
