import type { ReactNode } from 'react'

const TONES = {
  warn: 'bg-caramel/25 text-cocoa',
  danger: 'bg-danger/10 text-danger',
  muted: 'bg-latte/70 text-mocha',
  ok: 'bg-ok/10 text-ok',
} as const

export type FlagTone = keyof typeof TONES

export function Flag({ tone = 'warn', children }: { tone?: FlagTone; children: ReactNode }) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>
}
