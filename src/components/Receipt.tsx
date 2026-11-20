import type { Order } from '../types'
import { formatDateTime, orderNumberLabel } from '../lib/dates'
import { formatMoney } from '../lib/money'

export function Receipt({ order, onNewOrder }: { order: Order; onNewOrder: () => void }) {
  return (
    <div className="receipt-overlay fixed inset-0 z-50 overflow-y-auto bg-espresso/70 p-3">
      <div className="print-area mx-auto my-4 w-full max-w-sm rounded-2xl bg-white p-5 text-espresso shadow-2xl">
        <div className="text-center">
          <div className="text-xl font-black tracking-tight">Iverista POS</div>
          <div className="text-xs text-mocha">Point of sale</div>
        </div>

        <div className="mt-4 border-y border-dashed border-latte py-2 text-xs">
          <div className="flex justify-between">
            <span>Order</span>
            <span className="font-bold">{orderNumberLabel(order.number)}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Type</span>
            <span>{order.type === 'dine-in' ? 'Dine-in' : 'Takeaway'}</span>
          </div>
        </div>

        <table className="mt-3 w-full text-xs">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.drinkId}>
                <td className="py-0.5">
                  {item.qty}× {item.name}
                </td>
                <td className="py-0.5 text-right tabular-nums">
                  {formatMoney(item.lineSalesCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 space-y-0.5 border-t border-dashed border-latte pt-2 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMoney(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-base font-black">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(order.totalCents)}</span>
          </div>
        </div>

        <div className="mt-3 border-t border-dashed border-latte pt-2 text-xs">
          {order.payment === 'cash' ? (
            <>
              <div className="flex justify-between">
                <span>Cash</span>
                <span className="tabular-nums">{formatMoney(order.tenderedCents ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change</span>
                <span className="tabular-nums">{formatMoney(order.changeCents ?? 0)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span>GCash ref</span>
              <span className="tabular-nums">{order.gcashRef}</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-mocha">Thank you! ☕</p>
      </div>

      <div className="no-print mx-auto flex max-w-sm gap-2">
        <button className="btn btn-primary flex-1" onClick={() => window.print()}>
          Print receipt
        </button>
        <button className="btn btn-secondary flex-1" onClick={onNewOrder}>
          New order
        </button>
      </div>
    </div>
  )
}
