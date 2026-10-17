import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** 1 回目のクリック後に表示する確認の文言 */
  confirmLabel: string
  onConfirm: () => void
  /** false なら確認なしで実行する */
  needsConfirm?: boolean
  variant?: 'primary' | 'ghost'
  disabled?: boolean
}

/** 2 回押すと実行するボタン（ブラウザの確認ダイアログを使わずに誤操作を防ぐ） */
export function ConfirmButton({ children, confirmLabel, onConfirm, needsConfirm = true, variant, disabled }: Props) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])

  const handleClick = () => {
    if (needsConfirm && !armed) {
      setArmed(true)
      return
    }
    setArmed(false)
    onConfirm()
  }

  return (
    <button
      type="button"
      data-variant={armed ? 'danger' : variant}
      disabled={disabled}
      onClick={handleClick}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
