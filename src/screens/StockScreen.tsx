import { useState } from 'react'
import type { Ingredient, Store } from '../types'
import { receiveStock, setReorderLevel } from '../lib/actions'
import { formatMoney, parseQty } from '../lib/money'
import { ingredientUnitCost } from '../lib/pricing'
import { Flag } from '../components/Badges'
import { IngredientCostEditor } from '../components/IngredientCostEditor'
import { Modal } from '../components/Modal'

function ReorderInput({ ingredient }: { ingredient: Ingredient }) {
  const [text, setText] = useState(
    ingredient.reorderLevel > 0 ? ingredient.reorderLevel.toString() : '',
  )
  return (
    <input
      className="input w-24"
      inputMode="decimal"
      placeholder="0"
      value={text}
      aria-label={`Reorder level for ${ingredient.name}`}
      onChange={(event) => {
        setText(event.target.value)
        const value = parseQty(event.target.value)
        if (value !== null && value >= 0) setReorderLevel(ingredient.id, value)
      }}
    />
  )
}

function ReceiveModal({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient
  onClose: () => void
}) {
  const [qtyText, setQtyText] = useState('')
  const [error, setError] = useState('')
  const qty = parseQty(qtyText)

  function receive() {
    if (qty === null || qty <= 0) {
      setError('Enter a quantity greater than 0.')
      return
    }
    receiveStock(ingredient.id, qty)
    onClose()
  }

  return (
    <Modal
      open
      title={`Receive stock · ${ingredient.name}`}
      subtitle={`Current on hand: ${ingredient.onHand} ${ingredient.unit}`}
      onClose={onClose}
      size="max-w-md"
    >
      <label className="label" htmlFor="receive-qty">
        Quantity received ({ingredient.unit})
      </label>
      <input
        id="receive-qty"
        className="input"
        inputMode="decimal"
        placeholder="0"
        value={qtyText}
        onChange={(event) => setQtyText(event.target.value)}
      />
      {error ? <p className="mt-2 text-sm font-semibold text-danger">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <button className="btn btn-secondary flex-1" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary flex-1" onClick={receive}>
          Add to stock
        </button>
      </div>
    </Modal>
  )
}

export default function StockScreen({ store }: { store: Store }) {
  const [receiving, setReceiving] = useState<Ingredient | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">Stock</h1>
        <p className="text-sm text-mocha">
          Sales deduct ingredient lines. Custom lines (cup, lid, straw…) never touch stock. A
          negative count stays visible rather than blocking the sale.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-latte/40 text-xs uppercase tracking-wide text-mocha">
            <tr>
              <th className="table-cell">Ingredient</th>
              <th className="table-cell">Unit</th>
              <th className="table-cell text-right">On hand</th>
              <th className="table-cell">Reorder level</th>
              <th className="table-cell text-right">Unit cost</th>
              <th className="table-cell">Flags</th>
              <th className="table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.ingredients.map((ingredient) => {
              const low =
                ingredient.reorderLevel > 0 && ingredient.onHand <= ingredient.reorderLevel
              const negative = ingredient.onHand < 0
              return (
                <tr key={ingredient.id} className="border-t border-latte/60">
                  <td className="table-cell font-bold">{ingredient.name}</td>
                  <td className="table-cell text-mocha">{ingredient.unit}</td>
                  <td
                    className={`table-cell text-right font-semibold tabular-nums ${
                      negative ? 'text-danger' : ''
                    }`}
                  >
                    {ingredient.onHand}
                  </td>
                  <td className="table-cell">
                    <ReorderInput ingredient={ingredient} />
                  </td>
                  <td className="table-cell text-right tabular-nums">
                    {formatMoney(ingredientUnitCost(ingredient))}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {negative ? <Flag tone="danger">negative stock</Flag> : null}
                      {low ? <Flag tone="warn">low stock</Flag> : null}
                      {ingredient.purchaseQty <= 0 ? (
                        <Flag tone="muted">needs cost</Flag>
                      ) : null}
                    </div>
                  </td>
                  <td className="table-cell">
                    <button
                      className="btn btn-secondary px-3"
                      onClick={() => setReceiving(ingredient)}
                    >
                      Receive stock
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <IngredientCostEditor />

      {receiving ? (
        <ReceiveModal ingredient={receiving} onClose={() => setReceiving(null)} />
      ) : null}
    </div>
  )
}
