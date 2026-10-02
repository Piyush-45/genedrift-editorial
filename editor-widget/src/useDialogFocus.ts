import { useEffect, useRef } from 'react'

const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/** Keep keyboard focus in an open modal and return it to the triggering control. */
export function useDialogFocus(open: boolean, busy: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null)
  const latest = useRef({ busy, onClose })
  latest.current = { busy, onClose }
  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const controls = () => [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((node) => !node.closest('[hidden], [inert]'))
    const focusFirst = () => (controls()[0] || dialog).focus()
    focusFirst()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (!latest.current.busy) latest.current.onClose()
      }
      if (event.key !== 'Tab') return
      const items = controls()
      const first = items[0] || dialog
      const last = items.at(-1) || dialog
      if (!dialog.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last) || items.length === 0) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      }
    }
    const onFocusIn = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) focusFirst()
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('focusin', onFocusIn)
      if (previous?.isConnected) previous.focus()
    }
  }, [open])
  return dialogRef
}
