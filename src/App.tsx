import { useState } from 'react'
import type { CartLine, Order, OrderType } from './types'
import { useStore } from './lib/store'
import SellScreen from './screens/SellScreen'
import CheckoutScreen from './screens/CheckoutScreen'
import QueueScreen from './screens/QueueScreen'
import MenuScreen from './screens/MenuScreen'
import StockScreen from './screens/StockScreen'
import SalesScreen from './screens/SalesScreen'
import { Receipt } from './components/Receipt'

type Screen = 'sell' | 'checkout' | 'queue' | 'menu' | 'stock' | 'sales'

const NAV: { id: Exclude<Screen, 'checkout'>; label: string }[] = [
  { id: 'sell', label: 'Sell' },
  { id: 'queue', label: 'Queue' },
  { id: 'menu', label: 'Menu & recipes' },
  { id: 'stock', label: 'Stock' },
  { id: 'sales', label: 'Sales' },
]

export default function App() {
  const store = useStore()
  const [screen, setScreen] = useState<Screen>('sell')
  const [cart, setCart] = useState<CartLine[]>([])
  const [orderType, setOrderType] = useState<OrderType>('dine-in')
  const [showCost, setShowCost] = useState(false)
  const [receipt, setReceipt] = useState<Order | null>(null)

  function addToCart(drinkId: string) {
    setCart((current) => {
      const existing = current.find((line) => line.drinkId === drinkId)
      if (existing) {
        return current.map((line) =>
          line.drinkId === drinkId ? { ...line, qty: line.qty + 1 } : line,
        )
      }
      return [...current, { drinkId, qty: 1 }]
    })
  }

  function changeQty(drinkId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.drinkId === drinkId ? { ...line, qty: line.qty + delta } : line,
        )
        .filter((line) => line.qty > 0),
    )
  }

  function removeLine(drinkId: string) {
    setCart((current) => current.filter((line) => line.drinkId !== drinkId))
  }

  function handleComplete(order: Order) {
    setCart([])
    setReceipt(order)
    setScreen('sell')
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <header className="no-print sticky top-0 z-30 bg-espresso text-cream shadow">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-lg font-black leading-none tracking-tight">
                  Iverista POS
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-latte">
                  Point of sale
                </div>
              </div>
            </div>
            <nav className="flex flex-1 gap-1 overflow-x-auto">
              {NAV.map((item) => {
                const active =
                  screen === item.id || (screen === 'checkout' && item.id === 'sell')
                return (
                  <button
                    key={item.id}
                    className={`btn shrink-0 px-3 ${
                      active ? 'bg-cream text-espresso' : 'text-latte hover:bg-cocoa'
                    }`}
                    onClick={() => setScreen(item.id)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] flex-1 p-3 sm:p-4">
          {screen === 'sell' ? (
            <SellScreen
              store={store}
              cart={cart}
              orderType={orderType}
              showCost={showCost}
              onShowCost={setShowCost}
              onOrderType={setOrderType}
              onAdd={addToCart}
              onQty={changeQty}
              onRemove={removeLine}
              onCheckout={() => setScreen('checkout')}
            />
          ) : null}

          {screen === 'checkout' ? (
            <CheckoutScreen
              store={store}
              cart={cart}
              orderType={orderType}
              onBack={() => setScreen('sell')}
              onComplete={handleComplete}
            />
          ) : null}

          {screen === 'queue' ? <QueueScreen store={store} /> : null}
          {screen === 'menu' ? <MenuScreen store={store} /> : null}
          {screen === 'stock' ? <StockScreen store={store} /> : null}
          {screen === 'sales' ? <SalesScreen store={store} /> : null}
        </main>
      </div>

      {receipt ? (
        <Receipt order={receipt} onNewOrder={() => setReceipt(null)} />
      ) : null}
    </>
  )
}
