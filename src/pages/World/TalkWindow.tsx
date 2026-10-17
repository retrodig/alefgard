import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { ShopItemData } from '../../wasm/types'
import styles from './World.module.css'

interface Props {
  /** はなしている ひと（ウィンドウの タイトル） */
  speaker: string
  /** ▼ ごとの ページ（それぞれ 行の ならび） */
  pages: string[][]
  /** さいしょに 出す ページ（こたえた あとは つづきから） */
  startPage?: number
  /** しつもん中なら こたえを うけとる（さいごの ページで はい／いいえ を出す） */
  onAnswer?: (yes: boolean) => void
  /** おみせの しなもの（さいごの ページで 出す） */
  shopItems?: ShopItemData[]
  /** さいごの ページで 出す ボタン（せんとうへ など） */
  footer?: ReactNode
  onClose: () => void
}

/** ドラクエ風の メッセージウィンドウ。クリック・Enter で ページを おくり、さいごで とじる */
export function TalkWindow({ speaker, pages, startPage = 0, onAnswer, shopItems = [], footer, onClose }: Props) {
  const [page, setPage] = useState(Math.min(startPage, Math.max(pages.length - 1, 0)))
  const ref = useRef<HTMLDivElement>(null)
  const yesRef = useRef<HTMLButtonElement>(null)
  const last = page >= pages.length - 1
  const asking = last && !!onAnswer

  useEffect(() => {
    if (asking) yesRef.current?.focus({ preventScroll: true })
    else ref.current?.focus({ preventScroll: true })
  }, [asking])

  const next = () => {
    if (!last) setPage(page + 1)
    else if (!asking) onClose()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
      e.preventDefault()
      onClose()
      return
    }
    // しつもん中は はい／いいえ の ボタンで こたえる
    if (asking || e.target !== ref.current) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
      e.preventDefault()
      next()
    }
  }

  const onChoiceKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const buttons = [...e.currentTarget.querySelectorAll('button')]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    buttons[(index + 1) % buttons.length]?.focus()
  }

  return (
    <div
      ref={ref}
      className={styles.talk}
      role="dialog"
      aria-label={`${speaker}の はなし`}
      tabIndex={-1}
      onClick={next}
      onKeyDown={onKeyDown}
    >
      <span className={styles.talkTitle}>{speaker}</span>
      <div aria-live="polite">
        {pages[page]?.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      {!last && (
        <span className={styles.talkMore} aria-hidden>
          ▼
        </span>
      )}

      {asking && (
        // はい／いいえ（メッセージの 右上に 重ねる）
        <div className={styles.choice} role="group" aria-label="こたえ" onKeyDown={onChoiceKey}>
          <button ref={yesRef} type="button" onClick={(e) => (e.stopPropagation(), onAnswer(true))}>
            はい
          </button>
          <button type="button" onClick={(e) => (e.stopPropagation(), onAnswer(false))}>
            いいえ
          </button>
        </div>
      )}

      {last && shopItems.length > 0 && (
        <div className={styles.shop} aria-label="しなもの">
          <span className={styles.talkTitle}>しなもの</span>
          <ul>
            {shopItems.map((item) => (
              <li key={`${item.kind}:${item.name}`}>
                <span>{item.name}</span>
                <span>{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {last && footer && (
        <div className={styles.talkFooter} onClick={(e) => e.stopPropagation()}>
          {footer}
        </div>
      )}
    </div>
  )
}
