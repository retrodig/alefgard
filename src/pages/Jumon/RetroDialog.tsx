import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { RetroKeyboard } from './RetroKeyboard'
import styles from './RetroDialog.module.css'

interface Props {
  password: string
  onApply: (password: string) => void
  onClose: () => void
}

/** ファミコン風の じゅもん入力画面をオーバーレイで表示する */
export function RetroDialog({ password, onApply, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    // 開いたらすぐ矢印キーで操作できるよう 50 音表にフォーカスする
    dialog.querySelector<HTMLElement>('[role="grid"]')?.focus()
  }, [])

  const apply = (value: string) => {
    onApply(value)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="ふっかつのじゅもんを いれる"
      onClose={onClose}
      // 画面の外（背景）をクリックしたら閉じる
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <div className={styles.frame}>
        <button
          type="button"
          data-variant="ghost"
          className={styles.close}
          aria-label="とじる"
          onClick={() => dialogRef.current?.close()}
        >
          <X size={20} />
        </button>
        <RetroKeyboard password={password} onApply={apply} />
      </div>
    </dialog>
  )
}
