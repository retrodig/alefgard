import type { ReactNode } from 'react'
import styles from './Window.module.css'

interface Props {
  title?: string
  /** 左上（枠の中）に 出す 絵（キャラクター など）。右上の ボタンと おなじ 行に ならぶ */
  icon?: ReactNode
  /** 右上に置くボタンなど */
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** 左右の余白をなくし、中身（表など）を枠いっぱいに広げる */
  flush?: boolean
}

/** ドラクエ風のウィンドウ（黒地・白枠、タイトルは枠の上） */
export function Window({ title, icon, actions, children, className, flush = false }: Props) {
  return (
    <section className={[styles.window, className].filter(Boolean).join(' ')} data-flush={flush || undefined}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {icon ? (
        <div className={styles.topRow}>
          <div className={styles.icon}>{icon}</div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      ) : (
        actions && <div className={styles.actions}>{actions}</div>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
