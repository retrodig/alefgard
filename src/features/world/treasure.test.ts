import { describe, expect, it } from 'vitest'
import type { TreasureData } from '../../wasm/types'
import { habitatsOf, summarizeEncounter } from './encounter'
import { treasureInfo, type TreasureNames } from './treasure'

const names: TreasureNames = {
  item: (id) => ({ 7: 'ロトのしるし', 11: 'しのくびかざり', 12: 'たいようのいし', 14: 'にじのしずく' })[id] ?? '？',
  weapon: (id) => (id === 7 ? 'ロトのつるぎ' : '？'),
  armor: (id) => (id === 7 ? 'ロトのよろい' : '？'),
  dialogue: () => 'ここに　かくし\nかいだんが　ある。',
}

function treasure(extra: Partial<TreasureData>): TreasureData {
  return { map_id: 1, x: 0, y: 0, kind: 'chest', content: { type: 'key' }, ...extra }
}

describe('treasureInfo', () => {
  it('ゴールドは はばを出す', () => {
    expect(treasureInfo(treasure({ content: { type: 'gold', min: 6, max: 13 } }), names)).toEqual({
      title: 'たからばこ',
      lines: ['6〜13ゴールドが はいっている。'],
    })
  })

  it('からっぽに なる じょうけんを そえる', () => {
    const info = treasureInfo(
      treasure({ content: { type: 'key' }, name: 'かぎ', empty_if: { type: 'keys_full' } }),
      names,
    )
    expect(info.lines).toEqual(['かぎが はいっている。', '（かぎを もちきれない ときは からっぽ）'])
  })

  it('しらべると みつかる もの', () => {
    const info = treasureInfo(
      treasure({
        kind: 'hidden',
        content: { type: 'item', item: 7 },
        name: 'ロトのしるし',
        empty_if: { type: 'has_item', item: 7 },
      }),
      names,
    )
    expect(info).toEqual({
      title: 'しらべる',
      lines: ['しらべると ロトのしるしが みつかる。', '（ロトのしるしを もっている ときは からっぽ）'],
    })
  })

  it('アイテムか ゴールド', () => {
    const info = treasureInfo(
      treasure({
        content: { type: 'item_or_gold', item: 11, one_in: 32, gold_min: 100, gold_max: 131 },
        name: 'しのくびかざり',
      }),
      names,
    )
    expect(info.lines).toEqual(['しのくびかざりが はいっている。', '（1/32 の かくりつ。でなければ 100〜131ゴールド）'])
  })
})

describe('summarizeEncounter', () => {
  it('おなじ まものを まとめて でやすい じゅんに', () => {
    const slime = { id: 0, name: 'スライム' }
    const bubble = { id: 1, name: 'スライムベス' }
    expect(summarizeEncounter([slime, bubble, slime, bubble, slime])).toEqual([
      { id: 0, name: 'スライム', count: 3 },
      { id: 1, name: 'スライムベス', count: 2 },
    ])
  })
})

describe('habitatsOf', () => {
  const groups = [
    [0, 1, 0, 1, 0],
    [3, 3, 4, 4, 5],
  ]
  const maps = [
    {
      id: 1,
      name: 'アレフガルド',
      encounter_zones: [
        [0, 0],
        [1, 0],
      ],
    },
    { id: 4, name: 'ラダトームのしろ' },
    { id: 15, name: 'りゅうおうのしろ ちか1かい', encounter_group: 1 },
  ]

  it('フィールドは くかくの かず、ダンジョンは グループで しらべる', () => {
    expect(habitatsOf(0, maps, groups, [])).toEqual([
      { mapId: 1, mapName: 'アレフガルド', zones: 3, totalZones: 4, count: 3, fixed: false },
    ])
    expect(habitatsOf(3, maps, groups, [])).toEqual([
      { mapId: 1, mapName: 'アレフガルド', zones: 1, totalZones: 4, count: 2, fixed: false },
      { mapId: 15, mapName: 'りゅうおうのしろ ちか1かい', zones: null, totalZones: null, count: 2, fixed: false },
    ])
  })

  it('かならず でる ばしょ だけでも のせる', () => {
    expect(habitatsOf(24, maps, groups, [1])).toEqual([
      { mapId: 1, mapName: 'アレフガルド', zones: 0, totalZones: 4, count: 0, fixed: true },
    ])
  })
})
