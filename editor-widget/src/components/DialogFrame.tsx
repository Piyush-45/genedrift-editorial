import type { HTMLAttributes } from 'react'
import { useDialogFocus } from '../useDialogFocus'

export function DialogFrame({ busy, onClose, ...props }: HTMLAttributes<HTMLElement> & { busy: boolean; onClose: () => void }) {
  const ref = useDialogFocus(true, busy, onClose)
  return <section {...props} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" />
}
