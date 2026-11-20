import { useMemo, useState } from 'react'
import type { Store } from '../types'
import { clearDay, voidOrder } from '../lib/actions'
import { addDays, addMonths, addYears } from '../lib/calendar'
import { formatDateTime, localDateKey, orderNumberLabel } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { marginLabel, marginPercent } from '../lib/pricing'
import {
  PERIODS,
  dailyBuckets,
  monthlyBuckets,
  orderDateKey,
  ordersForPeriod,
  periodLabel,
  type Period,
  type SalesBucket,
} from '../lib/reporting'
import { computeDayStats } from '../lib/stats'
import { Flag } from '../components/Badges'
import { Calendar } from '../components/Calendar'
import { ConfirmDialog } from '../components/Modal'

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-mocha">{label}</div>
      <div className={`mt-1 text-2xl font-black ${tone === 'danger' ? 'text-danger' : ''}`}>
        {value}
      </div>
    </div>
  )
}

export default function SalesScreen({ store }: { store: Store }) {
  const [period, setPeriod] = useState<Period>('day')
  const [anchor, setAnchor] = useState(() => localDateKey())
  const [voidId, setVoidId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const periodOrders = ordersForPeriod(store.orders, period, anchor)
  const stats = computeDayStats(periodOrders)

  const markedDays = useMemo(
    () => [...new Set(store.orders.filter((order) => !order.voided).map(orderDateKey))],
    [store.orders],
  )

  const buckets =
    period === 'month'
      ? dailyBuckets(store.orders, anchor)
      : period === 'year'
        ? monthlyBuckets(store.orders, anchor)
        : []

  const move = (direction: number) => {
    setAnchor((current) =>
      period === 'day'
        ? addDays(current, direction)
        : period === 'month'
          ? addMonths(current, direction)
          : addYears(current, direction),
    )
  }

  const drillInto = (bucket: SalesBucket) => {
    setPeriod(period === 'month' ? 'day' : 'month')
    setAnchor(bucket.key)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">Sales</h1>
          <p className="text-sm text-mocha">
            {periodLabel(period, anchor)} · {stats.orderCount} sale
            {stats.orderCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={() => setAnchor(localDateKey())}>
            Jump to today
          </button>
          {period === 'day' && periodOrders.length > 0 ? (
            <button className="btn btn-danger" onClick={() => setConfirmClear(true)}>
              Clear this day
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-latte/40 p-1">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              className={`btn px-4 ${period === item.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            className="btn btn-secondary w-12 px-0 text-lg"
            onClick={() => move(-1)}
            aria-label={`Previous ${period}`}
          >
            ‹
          </button>
          <div className="min-w-44 text-center text-base font-extrabold">
            {periodLabel(period, anchor)}
          </div>
          <button
            className="btn btn-secondary w-12 px-0 text-lg"
            onClick={() => move(1)}
            aria-label={`Next ${period}`}
          >
            ›
          </button>
        </div>
      </div>

      <div
        className={`grid gap-4 ${
          period === 'day' ? 'xl:grid-cols-[20rem_minmax(0,1fr)]' : ''
        }`}
      >
        {period === 'day' ? (
          <Calendar selected={anchor} onSelect={setAnchor} markedDays={markedDays} />
        ) : null}

        <div className="min-w-0 space-y-4">
          {stats.costMissingOrders > 0 ? (
            <div className="rounded-2xl border border-caramel/60 bg-caramel/10 p-3 text-sm">
              <Flag tone="danger">cost missing</Flag>{' '}
              <span className="ml-1">
                {stats.costMissingOrders} sale{stats.costMissingOrders === 1 ? '' : 's'} in this
                period included a drink with no cost lines, so profit is incomplete.
              </span>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total sales" value={formatMoney(stats.totalSalesCents)} />
            <Stat label="Total cost" value={formatMoney(stats.totalCostCents)} />
            <Stat
              label="Gross profit"
              value={formatMoney(stats.profitCents)}
              tone={stats.profitCents < 0 ? 'danger' : undefined}
            />
            <Stat label="Margin" value={marginLabel(stats.marginPct)} />
          </div>

          {period !== 'day' ? (
            <section className="card overflow-x-auto">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-latte px-4 py-2">
                <h2 className="font-extrabold">
                  {period === 'month' ? 'Daily totals' : 'Monthly totals'}
                </h2>
                <span className="text-xs text-mocha">Open a row to drill down</span>
              </header>
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-latte/40 text-xs uppercase tracking-wide text-mocha">
                  <tr>
                    <th className="table-cell">{period === 'month' ? 'Day' : 'Month'}</th>
                    <th className="table-cell text-right">Orders</th>
                    <th className="table-cell text-right">Sales</th>
                    <th className="table-cell text-right">Cost</th>
                    <th className="table-cell text-right">Profit</th>
                    <th className="table-cell text-right">Margin</th>
                    <th className="table-cell"> </th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((bucket) => {
                    const empty = bucket.orderCount === 0
                    return (
                      <tr
                        key={bucket.key}
                        className={`border-t border-latte/60 ${empty ? 'text-mocha/50' : ''}`}
                      >
                        <td className="table-cell font-semibold">{bucket.label}</td>
                        <td className="table-cell text-right tabular-nums">
                          {bucket.orderCount}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {formatMoney(bucket.salesCents)}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {formatMoney(bucket.costCents)}
                        </td>
                        <td
                          className={`table-cell text-right tabular-nums ${
                            bucket.profitCents < 0 ? 'text-danger' : ''
                          }`}
                        >
                          {formatMoney(bucket.profitCents)}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {marginLabel(
                            marginPercent(bucket.salesCents, bucket.profitCents),
                          )}
                        </td>
                        <td className="table-cell text-right">
                          <button
                            className="btn btn-ghost px-3"
                            onClick={() => drillInto(bucket)}
                            disabled={empty}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          ) : null}

          <section className="card overflow-x-auto">
            <header className="border-b border-latte px-4 py-2">
              <h2 className="font-extrabold">Per drink</h2>
            </header>
            {stats.perDrink.length === 0 ? (
              <p className="p-4 text-sm text-mocha">No sales in this period.</p>
            ) : (
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-latte/40 text-xs uppercase tracking-wide text-mocha">
                  <tr>
                    <th className="table-cell">Drink</th>
                    <th className="table-cell text-right">Qty sold</th>
                    <th className="table-cell text-right">Sales</th>
                    <th className="table-cell text-right">Cost</th>
                    <th className="table-cell text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perDrink.map((row) => (
                    <tr key={`${row.drinkId}-${row.name}`} className="border-t border-latte/60">
                      <td className="table-cell font-semibold">{row.name}</td>
                      <td className="table-cell text-right tabular-nums">{row.qty}</td>
                      <td className="table-cell text-right tabular-nums">
                        {formatMoney(row.salesCents)}
                      </td>
                      <td className="table-cell text-right tabular-nums">
                        {formatMoney(row.costCents)}
                      </td>
                      <td
                        className={`table-cell text-right font-semibold tabular-nums ${
                          row.profitCents < 0 ? 'text-danger' : ''
                        }`}
                      >
                        {formatMoney(row.profitCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {period === 'day' ? (
            <section className="card overflow-x-auto">
              <header className="border-b border-latte px-4 py-2">
                <h2 className="font-extrabold">Orders</h2>
              </header>
              {periodOrders.length === 0 ? (
                <p className="p-4 text-sm text-mocha">No orders on this day.</p>
              ) : (
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-latte/40 text-xs uppercase tracking-wide text-mocha">
                    <tr>
                      <th className="table-cell">Order</th>
                      <th className="table-cell">Time</th>
                      <th className="table-cell">Type</th>
                      <th className="table-cell">Payment</th>
                      <th className="table-cell">Items</th>
                      <th className="table-cell text-right">Total</th>
                      <th className="table-cell text-right">Profit</th>
                      <th className="table-cell">Status</th>
                      <th className="table-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`border-t border-latte/60 ${order.voided ? 'opacity-50' : ''}`}
                      >
                        <td className="table-cell font-bold">
                          {orderNumberLabel(order.number)}
                        </td>
                        <td className="table-cell text-mocha">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="table-cell">
                          {order.type === 'dine-in' ? 'Dine-in' : 'Takeaway'}
                        </td>
                        <td className="table-cell">
                          {order.payment === 'cash' ? 'Cash' : 'GCash'}
                        </td>
                        <td className="table-cell text-mocha">
                          {order.items.map((item) => `${item.qty}× ${item.name}`).join(', ')}
                          {order.costMissing ? (
                            <span className="ml-2">
                              <Flag tone="danger">cost missing</Flag>
                            </span>
                          ) : null}
                        </td>
                        <td className="table-cell text-right font-semibold tabular-nums">
                          {formatMoney(order.totalCents)}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {formatMoney(order.profitCents)}
                        </td>
                        <td className="table-cell">
                          {order.voided ? (
                            <Flag tone="danger">voided</Flag>
                          ) : (
                            <Flag tone="ok">{order.status}</Flag>
                          )}
                        </td>
                        <td className="table-cell">
                          <button
                            className="btn btn-danger px-3"
                            disabled={order.voided}
                            onClick={() => setVoidId(order.id)}
                          >
                            Void
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={voidId !== null}
        title="Void this order?"
        message="The order is kept in the log but excluded from sales, cost and profit. Ingredient stock is restored."
        confirmLabel="Void order"
        destructive
        onCancel={() => setVoidId(null)}
        onConfirm={() => {
          if (voidId) voidOrder(voidId)
          setVoidId(null)
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title={`Clear ${periodLabel(period, anchor)}?`}
        message="This deletes every order recorded on that day. The menu, ingredient costs and stock counts are kept. If the day is today, order numbers restart at #001."
        confirmLabel="Clear day"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearDay(anchor)
          setConfirmClear(false)
        }}
      />
    </div>
  )
}
