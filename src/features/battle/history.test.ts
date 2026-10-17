import { describe, expect, it } from 'vitest'
import { addRecords, HISTORY_MAX, type BattleRecord } from './history'

function record(id: string): BattleRecord {
  return { id, at: '2026-10-18T00:00:00.000Z', hero: 'ゆうてい', monster: 'スライム', outcome: 'win', turns: 2, log: [] }
}

describe('addRecords', () => {
  it('新しいものを先頭に足す（あとに たたかった ものほど前）', () => {
    expect(addRecords([record('a')], [record('b'), record('c')]).map((r) => r.id)).toEqual(['c', 'b', 'a'])
  })

  it(`${HISTORY_MAX} を こえたら ふるいものを消す`, () => {
    const history = Array.from({ length: HISTORY_MAX }, (_, i) => record(`old-${i}`))
    const next = addRecords(history, [record('new')])
    expect(next).toHaveLength(HISTORY_MAX)
    expect(next[0].id).toBe('new')
    expect(next.at(-1)?.id).toBe(`old-${HISTORY_MAX - 2}`)
  })
})
