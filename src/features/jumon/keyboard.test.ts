import { describe, expect, it } from 'vitest'
import { PASSWORD_CHARS } from './kana'
import { cellAt, KEYBOARD_LAYOUT, moveCursor } from './keyboard'

describe('KEYBOARD_LAYOUT', () => {
  it('じゅもんの 64 文字をちょうど 1 回ずつ含む', () => {
    const values = KEYBOARD_LAYOUT.flat().flatMap((c) => (c?.type === 'char' ? [c.value] : []))
    expect(values).toHaveLength(PASSWORD_CHARS.length)
    expect(new Set(values)).toEqual(new Set(PASSWORD_CHARS))
  })
})

describe('moveCursor', () => {
  it('左右は空きマスを飛ばし、端で回り込む', () => {
    expect(moveCursor({ row: 3, col: 5 }, 'right')).toEqual({ row: 3, col: 7 })
    expect(moveCursor({ row: 3, col: 9 }, 'right')).toEqual({ row: 3, col: 0 })
    expect(moveCursor({ row: 0, col: 0 }, 'left')).toEqual({ row: 0, col: 9 })
  })

  it('上下は近いマスへ移り、端で回り込む', () => {
    expect(moveCursor({ row: 3, col: 8 }, 'down')).toEqual({ row: 4, col: 5 })
    expect(moveCursor({ row: 0, col: 3 }, 'up')).toEqual({ row: 7, col: 0 })
    expect(cellAt(moveCursor({ row: 6, col: 8 }, 'down'))).toEqual({ type: 'end' })
    expect(moveCursor({ row: 7, col: 5 }, 'down')).toEqual({ row: 0, col: 5 })
  })
})
