import { describe, expect, it } from 'vitest'
import type { EquipmentData, SpellData } from '../../wasm/types'
import { itemOptions, spellOptions } from './commands'

const spell = (id: number, name: string, learn_level: number, mp_cost: number): SpellData => ({
  id,
  name,
  learn_level,
  mp_cost,
  description: '',
})
const SPELLS = [spell(0, 'ホイミ', 3, 4), spell(1, 'ギラ', 4, 2), spell(2, 'ラリホー', 7, 2), spell(3, 'レミーラ', 9, 3)]

const item = (id: number, name: string): EquipmentData => ({ id, name, price: 0, sell: 0, attack: 0, defense: 0 })
const ITEMS = [item(0, 'なし'), item(1, 'たいまつ'), item(4, 'りゅうのうろこ'), item(5, 'ようせいのふえ')]

describe('spellOptions', () => {
  it('レベルで覚えた じゅもんを 1 始まりの番号で並べる', () => {
    expect(spellOptions(9, 10, SPELLS).map((o) => [o.selection, o.label])).toEqual([
      [1, 'ホイミ'],
      [2, 'ギラ'],
      [3, 'ラリホー'],
      [4, 'レミーラ'],
    ])
    expect(spellOptions(3, 10, SPELLS)).toHaveLength(1)
  })

  it('戦闘で使えない・MP が足りない じゅもんは選べない', () => {
    const options = spellOptions(9, 3, SPELLS)
    expect(options.find((o) => o.label === 'ホイミ')).toMatchObject({ disabled: true, reason: 'MP ぶそく' })
    expect(options.find((o) => o.label === 'ギラ')?.disabled).toBe(false)
    expect(options.find((o) => o.label === 'レミーラ')).toMatchObject({ disabled: true, reason: 'つかえない' })
  })
})

describe('itemOptions', () => {
  it('やくそう → かぎ → どうぐ の順に番号をふる', () => {
    const options = itemOptions(2, 1, ['りゅうのうろこ', 'なし', 'たいまつ'], ITEMS)
    expect(options.map((o) => [o.selection, o.label, o.disabled])).toEqual([
      [1, 'やくそう', false],
      [2, 'かぎ', true],
      [3, 'りゅうのうろこ', false],
      [4, 'たいまつ', true],
    ])
  })

  it('やくそう・かぎが 0 こなら一覧に出さない', () => {
    expect(itemOptions(0, 0, ['ようせいのふえ'], ITEMS).map((o) => [o.selection, o.label])).toEqual([[1, 'ようせいのふえ']])
  })
})
