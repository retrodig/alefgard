import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { PASSWORD_LENGTH } from '../../features/jumon/kana'
import {
  cellAt,
  INITIAL_CURSOR,
  KEYBOARD_COLS,
  KEYBOARD_LAYOUT,
  moveCursor,
  type Cursor,
  type Direction,
  type KeyCell,
} from '../../features/jumon/keyboard'
import styles from './RetroKeyboard.module.css'

interface Props {
  /** 現在のパラメータから作ったじゅもん */
  password: string
  /** 「おわり」で 20 文字のじゅもんが確定したら呼ばれる */
  onApply: (password: string) => void
}

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}
const SELECT_KEYS = new Set(['Enter', ' ', 'z', 'Z'])
const BACK_KEYS = new Set(['Backspace', 'x', 'X'])

const END_CURSOR: Cursor = {
  row: KEYBOARD_LAYOUT.length - 1,
  col: KEYBOARD_LAYOUT.at(-1)!.findIndex((c) => c?.type === 'end'),
}

function cellLabel(cell: NonNullable<KeyCell>): string {
  if (cell.type === 'back') return 'もどる'
  if (cell.type === 'end') return 'おわり'
  return cell.value
}

/** 5 マス × 2 グループの間に 1 列あけて CSS グリッドに配置する */
function gridColumn(cell: NonNullable<KeyCell>, col: number): string {
  const start = col < KEYBOARD_COLS / 2 ? col + 1 : col + 2
  return cell.type === 'char' ? String(start) : `${start} / span 3`
}

/** 50 音表をカーソルで選んで入力する、当時の雰囲気の入力画面 */
export function RetroKeyboard({ password, onApply }: Props) {
  const [chars, setChars] = useState<string[]>(() => [...password])
  const [prevPassword, setPrevPassword] = useState(password)
  const [cursor, setCursor] = useState<Cursor>(INITIAL_CURSOR)
  const [message, setMessage] = useState('')

  // パラメータ側の変更で じゅもんが変わったら表示を追従させる
  if (password !== prevPassword) {
    setPrevPassword(password)
    setChars([...password])
  }
  const gridRef = useRef<HTMLDivElement>(null)
  const idPrefix = useId()
  const cellId = (c: Cursor) => `${idPrefix}-${c.row}-${c.col}`

  const select = (target: Cursor) => {
    const cell = cellAt(target)
    if (!cell) return
    setMessage('')
    if (cell.type === 'back') {
      setChars((prev) => prev.slice(0, -1))
    } else if (cell.type === 'end') {
      if (chars.length === PASSWORD_LENGTH) onApply(chars.join(''))
      else setMessage(`あと ${PASSWORD_LENGTH - chars.length} もじ たりません`)
    } else if (chars.length < PASSWORD_LENGTH) {
      const next = [...chars, cell.value]
      setChars(next)
      // 20 文字そろったら「おわり」へ移動する
      if (next.length === PASSWORD_LENGTH) setCursor(END_CURSOR)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const direction = ARROW_KEYS[e.key]
    if (direction) {
      e.preventDefault()
      setCursor((c) => moveCursor(c, direction))
    } else if (SELECT_KEYS.has(e.key)) {
      e.preventDefault()
      select(cursor)
    } else if (BACK_KEYS.has(e.key)) {
      e.preventDefault()
      setMessage('')
      setChars((prev) => prev.slice(0, -1))
    }
  }

  const handleClick = (target: Cursor) => {
    setCursor(target)
    select(target)
    gridRef.current?.focus({ preventScroll: true })
  }

  const slots = Array.from({ length: PASSWORD_LENGTH }, (_, i) => chars[i] ?? null)

  return (
    <div className={styles.container}>
      <div className={styles.screen}>
        <div className={styles.window}>
          <p className={styles.prompt}>ふっかつのじゅもんを いれてください</p>
          <div className={styles.slots} aria-label={`入力中のじゅもん ${chars.length} / ${PASSWORD_LENGTH} もじ`}>
            {Array.from({ length: PASSWORD_LENGTH / 5 }, (_, r) => (
              <div key={r} className={styles.slotRow}>
                {slots.slice(r * 5, r * 5 + 5).map((ch, c) => {
                  const index = r * 5 + c
                  return (
                    <span
                      key={c}
                      className={index === chars.length ? styles.slotCurrent : ch ? styles.slot : styles.slotEmpty}
                    >
                      {ch ?? '・'}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div
          ref={gridRef}
          role="grid"
          tabIndex={0}
          aria-label="50 音表（矢印キーで移動、Enter / Z で決定、Backspace / X で 1 もじ戻る）"
          aria-activedescendant={cellId(cursor)}
          className={`${styles.window} ${styles.keyboard}`}
          onKeyDown={handleKeyDown}
        >
          {KEYBOARD_LAYOUT.map((row, r) => (
            <div key={r} role="row" className={styles.keyRow}>
              {row.map((cell, c) => {
                if (!cell) return null
                const active = cursor.row === r && cursor.col === c
                return (
                  <div
                    key={c}
                    id={cellId({ row: r, col: c })}
                    role="gridcell"
                    aria-selected={active}
                    className={[styles.key, active ? styles.keyActive : '', cell.type !== 'char' ? styles.command : '']
                      .filter(Boolean)
                      .join(' ')}
                    style={{ gridColumn: gridColumn(cell, c) }}
                    onClick={() => handleClick({ row: r, col: c })}
                  >
                    {cellLabel(cell)}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <p className={styles.message} aria-live="polite">
          {message}
        </p>
      </div>

      <p className={styles.help}>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>←</kbd>
          <kbd>→</kbd> いどう
        </span>
        <span>
          <kbd>Enter</kbd>
          <kbd>Z</kbd> けってい
        </span>
        <span>
          <kbd>Backspace</kbd>
          <kbd>X</kbd> 1 もじ もどる
        </span>
        <span>
          <kbd>Esc</kbd> とじる
        </span>
      </p>
    </div>
  )
}
