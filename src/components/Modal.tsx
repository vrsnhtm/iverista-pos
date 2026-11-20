import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  size?: string
}

export function Modal({ open, title, subtitle, onClose, children, size = 'max-w-2xl' }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-t-3xl bg-foam shadow-2xl sm:rounded-3xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-latte px-5 py-3">
          <div>
            <h2 className="text-xl font-extrabold">{title}</h2>
            {subtitle ? <p className="text-sm text-mocha">{subtitle}</p> : null}
          </div>
          <button className="btn btn-secondary w-12 px-0 text-lg" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="max-w-md">
      <p className="text-sm leading-relaxed text-cocoa">{message}</p>
      <div className="mt-5 flex gap-2">
        <button className="btn btn-secondary flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={`btn flex-1 ${destructive ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
