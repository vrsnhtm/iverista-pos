/** Format integer centavos (fractions allowed for unit costs) as ₱1,234.56. */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents) / 100
  return `${sign}₱${abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Parse a peso text field ("1,250.50") into centavos. Returns null when invalid. */
export function pesosToCents(raw: string): number | null {
  const cleaned = raw.replace(/[₱,\s]/g, '')
  if (cleaned === '') return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100)
}

/** Parse a plain quantity field. Returns null when invalid. */
export function parseQty(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, '')
  if (cleaned === '') return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return value
}

export interface ChangeResult {
  ok: boolean
  changeCents: number
  shortCents: number
}

export function changeFor(tenderedCents: number, totalCents: number): ChangeResult {
  const tendered = Number.isFinite(tenderedCents) ? tenderedCents : 0
  if (tendered < totalCents) {
    return { ok: false, changeCents: 0, shortCents: totalCents - tendered }
  }
  return { ok: true, changeCents: tendered - totalCents, shortCents: 0 }
}

/** Compact quantity display: 18, 0.5, 2.25. */
export function formatQty(qty: number): string {
  return Number(qty.toFixed(3)).toString()
}
