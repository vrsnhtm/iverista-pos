/**
 * Tiny persistence boundary. Everything the app stores goes through here, so
 * replacing localStorage with a real database later only touches this file.
 */
const PREFIX = 'kape-pos.'

function fullKey(key: string): string {
  return PREFIX + key
}

export function hasKey(key: string): boolean {
  try {
    return window.localStorage.getItem(fullKey(key)) !== null
  } catch {
    return false
  }
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(fullKey(key))
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(fullKey(key), JSON.stringify(value))
  } catch {
    // Storage full or unavailable: the in-memory store keeps working.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(fullKey(key))
  } catch {
    // ignore
  }
}
