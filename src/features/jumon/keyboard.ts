// 当時風のじゅもん入力画面で使う 50 音表とカーソル移動

export type KeyCell = { type: 'char'; value: string } | { type: 'back' } | { type: 'end' } | null

export interface Cursor {
  row: number
  col: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

/** 1 行 10 マス（5 マス × 2 グループ）。null は空きマス */
export const KEYBOARD_COLS = 10

const chars = (s: string): KeyCell[] => [...s].map((c) => (c === '_' ? null : { type: 'char', value: c }))

export const KEYBOARD_LAYOUT: KeyCell[][] = [
  chars('あいうえおかきくけこ'),
  chars('さしすせそたちつてと'),
  chars('なにぬねのはひふへほ'),
  chars('まみむめもや_ゆ_よ'),
  chars('らりるれろわ____'),
  chars('がぎぐげござじずぜぞ'),
  chars('だぢづでどばびぶべぼ'),
  [{ type: 'back' }, null, null, null, null, { type: 'end' }, null, null, null, null],
]

export const INITIAL_CURSOR: Cursor = { row: 0, col: 0 }

const isCommandRow = (row: number) => KEYBOARD_LAYOUT[row].some((cell) => cell !== null && cell.type !== 'char')

function nearestCol(row: number, col: number): number {
  const cells = KEYBOARD_LAYOUT[row]
  // コマンド行は左右のグループで行き先を決める
  if (isCommandRow(row)) {
    const groupStart = col < KEYBOARD_COLS / 2 ? 0 : KEYBOARD_COLS / 2
    if (cells[groupStart]) return groupStart
  }
  for (let d = 0; d < KEYBOARD_COLS; d++) {
    if (cells[col - d]) return col - d
    if (cells[col + d]) return col + d
  }
  return 0
}

/** 空きマスを飛ばしてカーソルを動かす（端では反対側へ回り込む） */
export function moveCursor(cursor: Cursor, direction: Direction): Cursor {
  const rows = KEYBOARD_LAYOUT.length
  if (direction === 'up' || direction === 'down') {
    const step = direction === 'up' ? -1 : 1
    const row = (cursor.row + step + rows) % rows
    return { row, col: nearestCol(row, cursor.col) }
  }
  const step = direction === 'left' ? -1 : 1
  const cells = KEYBOARD_LAYOUT[cursor.row]
  let col = cursor.col
  for (let i = 0; i < KEYBOARD_COLS; i++) {
    col = (col + step + KEYBOARD_COLS) % KEYBOARD_COLS
    if (cells[col]) return { row: cursor.row, col }
  }
  return cursor
}

export function cellAt(cursor: Cursor): KeyCell {
  return KEYBOARD_LAYOUT[cursor.row]?.[cursor.col] ?? null
}
