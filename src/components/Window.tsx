import type { ReactNode } from 'react'
import styles from './Window.module.css'

interface Props {
  title?: string
  /** 右上に置くボタンなど */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** ドラクエ風のウィンドウ（黒地・白枠、タイトルは枠の上） */
export function Window({ title, actions, children, className }: Props) {
  return (
    <section className={[styles.window, className].filter(Boolean).join(' ')}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {actions && <div className={styles.actions}>{actions}</div>}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
