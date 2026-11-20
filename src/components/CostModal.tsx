import { useState } from 'react'
import type { CostLine } from '../types'
import { addCustomLine, addIngredientLine, removeCostLine, updateDrink } from '../lib/actions'
import { formatMoney, formatQty, parseQty, pesosToCents } from '../lib/money'
import {
  costPerCupCents,
  ingredientUnitCost,
  lineCostCents,
  marginLabel,
  marginPercent,
  needsCost,
} from '../lib/pricing'
import { useStore } from '../lib/store'
import { Flag } from './Badges'
import { Modal } from './Modal'

type Mode = 'ingredient' | 'custom'

export function CostModal({ drinkId, onClose }: { drinkId: string; onClose: () => void }) {
  const store = useStore()
  const drink = store.drinks.find((d) => d.id === drinkId)
  const ingredients = store.ingredients

  const [priceText, setPriceText] = useState(() =>
    drink && drink.priceCents > 0 ? (drink.priceCents / 100).toString() : '',
  )
  const [mode, setMode] = useState<Mode>('ingredient')
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? '')
  const [qtyText, setQtyText] = useState('')
  const [customName, setCustomName] = useState('')
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState('')

  if (!drink) return null

  const costCents = costPerCupCents(drink, ingredients)
  const profitCents = drink.priceCents - costCents
  const margin = marginPercent(drink.priceCents, profitCents)
  const selectedIngredient = ingredients.find((i) => i.id === ingredientId)
  const selectedUnitCost = selectedIngredient ? ingredientUnitCost(selectedIngredient) : 0

  function lineLabel(line: CostLine): string {
    if (line.kind === 'custom') return line.name
    const ingredient = ingredients.find((i) => i.id === line.ingredientId)
    return ingredient
      ? `${ingredient.name} · ${formatQty(line.qty)} ${ingredient.unit}`
      : 'Unknown ingredient'
  }

  function handlePrice(value: string) {
    setPriceText(value)
    updateDrink(drink!.id, { priceCents: pesosToCents(value) ?? 0 })
  }

  function handleAddLine() {
    const current = store.drinks.find((d) => d.id === drinkId)
    if (!current) return

    if (mode === 'ingredient') {
      const qty = parseQty(qtyText)
      if (!ingredientId) {
        setError('Pick an ingredient.')
        return
      }
      if (qty === null || qty <= 0) {
        setError('Enter a quantity greater than 0.')
        return
      }
      addIngredientLine(drinkId, ingredientId, qty)
      setQtyText('')
    } else {
      const amount = pesosToCents(amountText)
      if (!customName.trim()) {
        setError('Give the custom line a name (for example “cup”).')
        return
      }
      if (amount === null || amount < 0) {
        setError('Enter an amount of 0 or more.')
        return
      }
      addCustomLine(drinkId, customName.trim(), amount)
      setCustomName('')
      setAmountText('')
    }
    setError('')
  }

  return (
    <Modal
      open
      title={drink.name}
      subtitle="Cost per cup, profit and margin"
      onClose={onClose}
      size="max-w-3xl"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          <div>
            <label className="label" htmlFor="cost-price">
              Price (₱)
            </label>
            <input
              id="cost-price"
              className="input"
              inputMode="decimal"
              placeholder="0.00"
              value={priceText}
              onChange={(event) => handlePrice(event.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-mocha">Cost lines</h3>
              {needsCost(drink) ? <Flag>needs cost</Flag> : null}
            </div>
            {drink.costLines.length === 0 ? (
              <p className="rounded-xl border border-dashed border-latte bg-white/60 p-3 text-sm text-mocha">
                No cost lines yet. Add an ingredient line, or one custom line like “Total cost” if
                you only want a single number per cup.
              </p>
            ) : (
              <ul className="divide-y divide-latte/60 rounded-xl border border-latte bg-white">
                {drink.costLines.map((line) => (
                  <li key={line.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{lineLabel(line)}</div>
                      <div className="text-xs text-mocha">
                        {line.kind === 'ingredient' ? 'Ingredient' : 'Custom'} ·{' '}
                        {formatMoney(lineCostCents(line, ingredients))}
                      </div>
                    </div>
                    <button
                      className="btn btn-danger min-h-12 px-3"
                      onClick={() => removeCostLine(drink.id, line.id)}
                      aria-label={`Delete ${lineLabel(line)}`}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-latte bg-white p-3">
            <div className="mb-2 flex gap-2">
              <button
                className={`btn flex-1 ${mode === 'ingredient' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setMode('ingredient')
                  setError('')
                }}
              >
                Ingredient
              </button>
              <button
                className={`btn flex-1 ${mode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setMode('custom')
                  setError('')
                }}
              >
                Custom
              </button>
            </div>

            {mode === 'ingredient' ? (
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <div>
                  <label className="label" htmlFor="cost-ingredient">
                    Ingredient
                  </label>
                  <select
                    id="cost-ingredient"
                    className="input"
                    value={ingredientId}
                    onChange={(event) => setIngredientId(event.target.value)}
                  >
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="cost-qty">
                    Quantity
                  </label>
                  <input
                    id="cost-qty"
                    className="input"
                    inputMode="decimal"
                    placeholder="0"
                    value={qtyText}
                    onChange={(event) => setQtyText(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <div>
                  <label className="label" htmlFor="cost-custom-name">
                    Name
                  </label>
                  <input
                    id="cost-custom-name"
                    className="input"
                    placeholder="cup, lid, straw…"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="cost-custom-amount">
                    Amount (₱)
                  </label>
                  <input
                    id="cost-custom-amount"
                    className="input"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amountText}
                    onChange={(event) => setAmountText(event.target.value)}
                  />
                </div>
              </div>
            )}

            {mode === 'ingredient' && selectedIngredient ? (
              <p className="mt-2 text-xs text-mocha">
                Unit cost {formatMoney(selectedUnitCost)} / {selectedIngredient.unit}.{' '}
                {selectedIngredient.purchaseQty <= 0
                  ? 'No purchase cost set for this ingredient yet — set it in Stock so this line counts.'
                  : `This line will cost ${formatMoney(
                      (parseQty(qtyText) ?? 0) * selectedUnitCost,
                    )}.`}
              </p>
            ) : null}

            {error ? <p className="mt-2 text-sm font-semibold text-danger">{error}</p> : null}

            <button className="btn btn-primary mt-3 w-full" onClick={handleAddLine}>
              Add cost line
            </button>
          </div>
        </div>

        <aside className="self-start rounded-2xl bg-espresso p-4 text-cream md:sticky md:top-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-latte">
            Cost per cup
          </div>
          <div className="text-3xl font-black">{formatMoney(costCents)}</div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-latte">
            Profit per cup
          </div>
          <div
            className={`text-3xl font-black ${profitCents < 0 ? 'text-[#ffb4ab]' : 'text-[#a8e6c1]'}`}
          >
            {formatMoney(profitCents)}
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-latte">
            Margin
          </div>
          <div className="text-2xl font-black">{marginLabel(margin)}</div>
          <p className="mt-4 text-xs leading-relaxed text-latte">
            Updates instantly as you add or remove lines. Cost lines are saved right away.
          </p>
        </aside>
      </div>
    </Modal>
  )
}
