import { useSyncExternalStore } from 'react'
import type { Store } from '../types'
import { hasKey, readJson, writeJson } from './storage'
import { seedStore } from './seed'

const STORAGE_KEY = 'state'

function loadState(): Store {
  const saved = hasKey(STORAGE_KEY) ? readJson<Store>(STORAGE_KEY) : null
  if (saved && saved.version === 1) {
    return {
      ...saved,
      drinks: Array.isArray(saved.drinks) ? saved.drinks : [],
      ingredients: Array.isArray(saved.ingredients) ? saved.ingredients : [],
      orders: Array.isArray(saved.orders) ? saved.orders : [],
      seqDate: saved.seqDate ?? null,
      seq: saved.seq ?? 0,
    }
  }
  // First run (or unusable saved data): seed the menu automatically.
  const seeded = seedStore()
  writeJson(STORAGE_KEY, seeded)
  return seeded
}

let state: Store = loadState()
const listeners = new Set<() => void>()

export function getState(): Store {
  return state
}

export function update(change: (current: Store) => Store): void {
  state = change(state)
  writeJson(STORAGE_KEY, state)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useStore(): Store {
  return useSyncExternalStore(subscribe, getState, getState)
}
