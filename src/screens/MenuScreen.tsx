import { useState } from 'react'
import type { Category, Drink, Store } from '../types'
import { CATEGORIES } from '../types'
import {
  addDrink,
  resetToSeedMenu,
  updateDrink,
} from '../lib/actions'
import { formatMoney, pesosToCents } from '../lib/money'
import {
  costPerCupCents,
  marginLabel,
  marginPercent,
  needsCost,
  needsPrice,
} from '../lib/pricing'
import { useStore } from '../lib/store'
import { ConfirmDialog, Modal } from '../components/Modal'
import { Flag } from '../components/Badges'
import { CostModal } from '../components/CostModal'
import { IngredientCostEditor } from '../components/IngredientCostEditor'

function DrinkModal({
  drinkId,
  onClose,
}: {
  drinkId: string | 'new'
  onClose: () => void
}) {
  const store = useStore()
  const existing = drinkId === 'new' ? null : store.drinks.find((d) => d.id === drinkId) ?? null

  const [name, setName] = useState(existing?.name ?? '')
  const [category, setCategory] = useState<Category>(existing?.category ?? 'Coffee')
  const [priceText, setPriceText] = useState(
    existing && existing.priceCents > 0 ? (existing.priceCents / 100).toString() : '',
  )
  const [active, setActive] = useState(existing?.active ?? true)
  const [error, setError] = useState('')

  function save() {
    if (!name.trim()) {
      setError('Enter a drink name.')
      return
    }
    const payload = {
      name: name.trim(),
      category,
      priceCents: pesosToCents(priceText) ?? 0,
      active,
    }
    if (existing) updateDrink(existing.id, payload)
    else addDrink(payload)
    onClose()
  }

  return (
    <Modal open title={existing ? 'Edit drink' : 'Add drink'} onClose={onClose} size="max-w-lg">
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="drink-name">
            Name
          </label>
          <input
            id="drink-name"
            className="input"
            placeholder="e.g. Spanish Latte"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="drink-category">
              Category
            </label>
            <select
              id="drink-category"
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="drink-price">
              Price (₱)
            </label>
            <input
              id="drink-price"
              className="input"
              inputMode="decimal"
              placeholder="0.00"
              value={priceText}
              onChange={(event) => setPriceText(event.target.value)}
            />
          </div>
        </div>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-latte bg-white px-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-espresso"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          <span className="text-sm font-semibold">Active on the Sell screen</span>
        </label>
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        <div className="flex gap-2 pt-1">
          <button className="btn btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary flex-1" onClick={save}>
            Save drink
          </button>
        </div>
      </div>
    </Modal>
  )
}

function actionLabel(drink: Drink): string {
  return drink.active ? 'Active' : 'Inactive'
}

export default function MenuScreen({ store }: { store: Store }) {
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [costFor, setCostFor] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">Menu &amp; recipes</h1>
          <p className="text-sm text-mocha">
            Enter each drink’s recipe cost once; profit and margin update everywhere.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={() => setConfirmReset(true)}>
            Reset to seed menu
          </button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + Add drink
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-latte/40 text-xs uppercase tracking-wide text-mocha">
            <tr>
              <th className="table-cell">Name</th>
              <th className="table-cell">Category</th>
              <th className="table-cell text-right">Price</th>
              <th className="table-cell text-right">Cost per cup</th>
              <th className="table-cell text-right">Profit per cup</th>
              <th className="table-cell text-right">Margin</th>
              <th className="table-cell">Flags</th>
              <th className="table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.drinks.map((drink) => {
              const cost = costPerCupCents(drink, store.ingredients)
              const profit = drink.priceCents - cost
              const margin = marginPercent(drink.priceCents, profit)
              return (
                <tr key={drink.id} className="border-t border-latte/60">
                  <td className="table-cell font-bold">{drink.name}</td>
                  <td className="table-cell text-mocha">{drink.category}</td>
                  <td className="table-cell text-right tabular-nums">
                    {formatMoney(drink.priceCents)}
                  </td>
                  <td className="table-cell text-right tabular-nums">{formatMoney(cost)}</td>
                  <td
                    className={`table-cell text-right font-semibold tabular-nums ${
                      profit < 0 ? 'text-danger' : ''
                    }`}
                  >
                    {formatMoney(profit)}
                  </td>
                  <td className="table-cell text-right tabular-nums">{marginLabel(margin)}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {needsPrice(drink) ? <Flag>needs price</Flag> : null}
                      {needsCost(drink) ? <Flag tone="warn">needs cost</Flag> : null}
                      {!drink.active ? <Flag tone="muted">inactive</Flag> : null}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      <button
                        className="btn btn-secondary px-3"
                        onClick={() => setCostFor(drink.id)}
                      >
                        Add cost
                      </button>
                      <button
                        className="btn btn-ghost px-3"
                        onClick={() => setEditing(drink.id)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn px-3 ${
                          drink.active
                            ? 'bg-ok/10 text-ok ring-1 ring-ok/30'
                            : 'btn-secondary'
                        }`}
                        onClick={() => updateDrink(drink.id, { active: !drink.active })}
                        aria-label={`Toggle active for ${drink.name}`}
                      >
                        {actionLabel(drink)}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <IngredientCostEditor />

      {editing ? <DrinkModal drinkId={editing} onClose={() => setEditing(null)} /> : null}
      {costFor ? <CostModal drinkId={costFor} onClose={() => setCostFor(null)} /> : null}

      <ConfirmDialog
        open={confirmReset}
        title="Reset to seed menu?"
        message="This replaces the whole drink list with the seeded PHP menu. Every price and every recipe cost line you entered will be lost. Ingredients, stock and past orders are kept."
        confirmLabel="Reset menu"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetToSeedMenu()
          setConfirmReset(false)
        }}
      />
    </div>
  )
}
