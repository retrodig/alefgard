import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'
import styles from './HelpTip.module.css'

interface Props {
  /** ボタンの 読み上げ（なにの せつめいか） */
  label: string
  children: ReactNode
  /** ふきだしを ボタンの どちらに そろえるか */
  align?: 'left' | 'right'
}

/**
 * 「？」ボタンで せつめいを 出す ふきだし。
 * マウスを のせる・フォーカスする と 出て、クリック（タッチ）で 出したままに できる。そとを おすか Esc で とじる
 */
export function HelpTip({ label, children, align = 'right' }: Props) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span ref={ref} className={styles.helpTip} data-open={open || undefined}>
      <button
        type="button"
        className={styles.button}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen(!open)}
      >
        <CircleHelp size={15} />
      </button>
      <span id={id} role="tooltip" className={styles.bubble} data-align={align}>
        {children}
      </span>
    </span>
  )
}
