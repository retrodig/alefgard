import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { beforeAll, describe, expect, it } from 'vitest'
import { initSync, WasmGame } from 'damdara'
import { DamdaraGame } from './game'

const require = createRequire(import.meta.url)

beforeAll(() => {
  const wasmPath = require.resolve('damdara/damdara_bg.wasm')
  initSync({ module: readFileSync(wasmPath) })
})

const newGame = () => new DamdaraGame(new WasmGame())

describe('DamdaraGame', () => {
  it('名前からじゅもんを生成し、同じじゅもんに戻せる', () => {
    const game = newGame()
    const created = game.createPlayer('だい')
    expect(created.summary.level).toBe(1)

    const password = game.generatePassword()
    expect([...password]).toHaveLength(20)

    const loaded = newGame().loadFromPassword(password)
    expect(loaded.summary).toEqual(created.summary)
  })

  it('濁点を分けたなまえでも同じプレイヤーになる', () => {
    const a = newGame()
    a.createPlayer('だい')
    const b = newGame()
    b.createPlayer('た゛い')
    expect(b.generatePassword()).toBe(a.generatePassword())
  })

  it('不正なじゅもんは Error を投げる', () => {
    expect(() => newGame().loadFromPassword('あ')).toThrow(Error)
  })

  it('マスターデータを取得できる', () => {
    const game = newGame()
    expect(game.getMonsters().length).toBeGreaterThan(0)
    expect(game.getStatusTable()).toHaveLength(30)
  })

  it('戦闘が決着まで進む', () => {
    const game = newGame()
    game.createPlayer('だい')
    const result = game.runBattle(0)
    const settled =
      result.monster_defeated || !result.player_survived || result.player_escaped || result.monster_escaped
    expect(settled).toBe(true)
  })
})
