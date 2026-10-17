import type { ReactNode } from 'react'
import styles from './Window.module.css'

interface Props {
  title?: string
  /** 右上に置くボタンなど */
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** 左右の余白をなくし、中身（表など）を枠いっぱいに広げる */
  flush?: boolean
}

/** ドラクエ風のウィンドウ（黒地・白枠、タイトルは枠の上） */
export function Window({ title, actions, children, className, flush = false }: Props) {
  return (
    <section className={[styles.window, className].filter(Boolean).join(' ')} data-flush={flush || undefined}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {actions && <div className={styles.actions}>{actions}</div>}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
