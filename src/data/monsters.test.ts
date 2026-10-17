import { describe, expect, it } from 'vitest'
import { monsterLabel } from './monsters'

const MONSTERS = [
  { id: 0, name: 'スライム' },
  { id: 38, name: 'りゅうおう' },
  { id: 39, name: 'りゅうおう' },
]

describe('monsterLabel', () => {
  it('なまえが重ならなければ そのまま', () => {
    expect(monsterLabel(MONSTERS[0], MONSTERS)).toBe('スライム')
  })

  it('同じなまえは形態を付ける', () => {
    expect(monsterLabel(MONSTERS[1], MONSTERS)).toBe('りゅうおう（だい1けいたい）')
    expect(monsterLabel(MONSTERS[2], MONSTERS)).toBe('りゅうおう（だい2けいたい）')
  })
})
