import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { beforeAll, describe, expect, it } from 'vitest'
import { initSync, WasmGame } from 'damdara'
import { DamdaraGame } from '../../wasm/game'
import { DEFAULT_SAVE, encodePassword } from '../jumon/password'
import { itemOptions, spellOptions } from './commands'
import { cleanBattleMessages } from './messages'

const require = createRequire(import.meta.url)

beforeAll(() => {
  initSync({ module: readFileSync(require.resolve('damdara/damdara_bg.wasm')) })
})

/** やくそう 2・かぎ 1・りゅうのうろこ・たいまつ を持った Lv30 のゆうしゃで りゅうおうと戦う */
function startBattle() {
  const game = new DamdaraGame(new WasmGame())
  const save = {
    ...DEFAULT_SAVE,
    experience: 65535,
    herbs: 2,
    keys: 1,
    items: [4, 1, 0, 0, 0, 0, 0, 0],
  }
  game.loadFromPassword(encodePassword(save))
  const first = game.startBattle(39)
  return { game, save, first }
}

describe('ターン制の戦闘（damdara との組み合わせ）', () => {
  it('出現から始まり、1 ターンずつ進む', () => {
    const { game, first } = startBattle()
    expect(first.turn).toBe(0)
    expect(cleanBattleMessages(first.messages)[0]).toBe('りゅうおうがあらわれた！')
    const next = game.battleTurn('attack')
    expect(next.turn).toBe(1)
    expect(game.isInBattle()).toBe(!next.is_finished)
  })

  it('どうぐの番号が damdara の一覧と一致する', () => {
    const { game, save, first } = startBattle()
    const options = itemOptions(save.herbs, save.keys, first.player_state.items, game.getItems())
    const herb = options.find((o) => o.label === 'やくそう')!
    const scale = options.find((o) => o.label === 'りゅうのうろこ')!

    const herbTurn = cleanBattleMessages(game.battleTurn('item', herb.selection).messages)
    expect(herbTurn.some((m) => m.includes('やくそうを つかった'))).toBe(true)

    const scaleTurn = cleanBattleMessages(game.battleTurn('item', scale.selection).messages)
    expect(scaleTurn.some((m) => m.includes('りゅうのうろこ'))).toBe(true)
  })

  it('じゅもんの番号が damdara の一覧と一致する', () => {
    const { game, first } = startBattle()
    const { level, mp } = first.player_state.summary
    const options = spellOptions(level, mp, game.getSpells())
    const behoimi = options.find((o) => o.label === 'ベホイミ')!
    const messages = cleanBattleMessages(game.battleTurn('spell', behoimi.selection).messages)
    expect(messages.some((m) => m.includes('ベホイミ'))).toBe(true)
  })
})
