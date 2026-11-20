import { useState } from 'react'
import { setIngredientCost } from '../lib/actions'
import { formatMoney, parseQty, pesosToCents } from '../lib/money'
import { ingredientUnitCost } from '../lib/pricing'
import { useStore } from '../lib/store'
import type { Ingredient } from '../types'
import { Flag } from './Badges'

function IngredientCostRow({ ingredient }: { ingredient: Ingredient }) {
  const [costText, setCostText] = useState(
    ingredient.purchaseCostCents > 0 ? (ingredient.purchaseCostCents / 100).toString() : '',
  )
  const [qtyText, setQtyText] = useState(
    ingredient.purchaseQty > 0 ? ingredient.purchaseQty.toString() : '',
  )

  const costCents = pesosToCents(costText)
  const qty = parseQty(qtyText)
  const previewUnit =
    costCents !== null && qty !== null && qty > 0
      ? costCents / qty
      : ingredientUnitCost(ingredient)
  const dirty =
    (costCents ?? 0) !== ingredient.purchaseCostCents || (qty ?? 0) !== ingredient.purchaseQty
  const valid = costCents !== null && costCents >= 0 && qty !== null && qty > 0

  return (
    <tr className="border-t border-latte/60">
      <td className="table-cell font-semibold">
        {ingredient.name}
        {ingredient.purchaseQty <= 0 ? (
          <span className="ml-2">
            <Flag>needs cost</Flag>
          </span>
        ) : null}
      </td>
      <td className="table-cell text-mocha">{ingredient.unit}</td>
      <td className="table-cell">
        <input
          className="input w-28"
          inputMode="decimal"
          placeholder="0.00"
          value={costText}
          onChange={(event) => setCostText(event.target.value)}
          aria-label={`Purchase cost for ${ingredient.name}`}
        />
      </td>
      <td className="table-cell">
        <input
          className="input w-24"
          inputMode="decimal"
          placeholder="0"
          value={qtyText}
          onChange={(event) => setQtyText(event.target.value)}
          aria-label={`Purchase quantity for ${ingredient.name}`}
        />
      </td>
      <td className="table-cell font-semibold">
        {formatMoney(previewUnit)} / {ingredient.unit}
      </td>
      <td className="table-cell">
        <button
          className="btn btn-secondary"
          disabled={!dirty || !valid}
          onClick={() => {
            if (costCents === null || qty === null) return
            setIngredientCost(ingredient.id, costCents, qty)
          }}
        >
          Save
        </button>
      </td>
    </tr>
  )
}

export function IngredientCostEditor() {
  const store = useStore()

  return (
    <section className="card p-4">
      <h2 className="text-lg font-extrabold">Ingredient costs</h2>
      <p className="text-sm text-mocha">
        Unit cost = purchase cost ÷ purchase quantity. Saving here updates every drink that uses
        the ingredient.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-latte/40 text-xs uppercase tracking-wide text-mocha">
            <tr>
              <th className="table-cell">Ingredient</th>
              <th className="table-cell">Unit</th>
              <th className="table-cell">Purchase cost (₱)</th>
              <th className="table-cell">Purchase qty</th>
              <th className="table-cell">Unit cost</th>
              <th className="table-cell"> </th>
            </tr>
          </thead>
          <tbody>
            {store.ingredients.map((ingredient) => (
              <IngredientCostRow key={ingredient.id} ingredient={ingredient} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
