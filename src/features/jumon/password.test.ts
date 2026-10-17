import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { beforeAll, describe, expect, it } from 'vitest'
import { initSync, WasmGame } from 'damdara'
import { DamdaraGame } from '../../wasm/game'
import { NAME_CHARS } from './kana'
import { decodePassword, DEFAULT_SAVE, encodePassword, LIMITS, padName, type SaveData } from './password'

const require = createRequire(import.meta.url)

beforeAll(() => {
  initSync({ module: readFileSync(require.resolve('damdara/damdara_bg.wasm')) })
})

const newGame = () => new DamdaraGame(new WasmGame())

// 再現性のある疑似乱数
function rng(seed: number) {
  let s = seed
  return (max: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s % (max + 1)
  }
}

function randomSave(rand: (max: number) => number): SaveData {
  const nameChars = Array.from({ length: 4 }, () => NAME_CHARS[rand(NAME_CHARS.length - 1)])
  return {
    name: nameChars.join(''),
    experience: rand(LIMITS.experience),
    gold: rand(LIMITS.gold),
    weapon: rand(LIMITS.weapon),
    armor: rand(LIMITS.armor),
    shield: rand(LIMITS.shield),
    items: Array.from({ length: LIMITS.itemSlots }, () => rand(14)),
    herbs: rand(LIMITS.herbs),
    keys: rand(LIMITS.keys),
    flags: {
      hasDragonScale: rand(1) === 1,
      hasWarriorRing: rand(1) === 1,
      hasCursedNecklace: rand(1) === 1,
      defeatedDragon: rand(1) === 1,
      defeatedGolem: rand(1) === 1,
    },
    pattern: rand(LIMITS.pattern),
  }
}

describe('encodePassword / decodePassword', () => {
  it('damdara（CLI）で作ったじゅもんを読み、同じじゅもんに戻せる', () => {
    // damdara -n だい -e 7000 -g 1234 -w 5 -a 4 -s 2 -m save
    const password = 'こぐりぎざぶそわげげぬきそてぬひでほるが'
    const { save, checksumValid } = decodePassword(password)
    expect(checksumValid).toBe(true)
    expect(save).toMatchObject({ name: 'た゛い　', experience: 7000, gold: 1234, weapon: 5, armor: 4, shield: 2 })
    expect(encodePassword(save)).toBe(password)
  })

  it('なまえだけのじゅもんが damdara の生成結果と一致する', () => {
    for (const name of ['ゆうてい', 'た゛い', 'は゜ひ゜', 'あ']) {
      const game = newGame()
      game.createPlayer(name)
      expect(encodePassword({ ...DEFAULT_SAVE, name: padName(name) })).toBe(game.generatePassword())
    }
  })

  it('ランダムなパラメータで往復し、damdara の読み取り結果とも一致する', () => {
    const rand = rng(42)
    const { items: itemMaster, weapons, armors, shields } = (() => {
      const g = newGame()
      return { items: g.getItems(), weapons: g.getWeapons(), armors: g.getArmors(), shields: g.getShields() }
    })()

    for (let i = 0; i < 200; i++) {
      const save = randomSave(rand)
      const password = encodePassword(save)
      const decoded = decodePassword(password)
      expect(decoded.checksumValid).toBe(true)
      expect(decoded.save).toEqual(save)

      const state = newGame().loadFromPassword(password)
      expect(state.summary.experience).toBe(save.experience)
      expect(state.summary.gold).toBe(save.gold)
      expect(state.summary.name).toBe(save.name)
      expect(state.strength_status.weapon).toBe(weapons[save.weapon].name)
      expect(state.strength_status.armor).toBe(armors[save.armor].name)
      expect(state.strength_status.shield).toBe(shields[save.shield].name)
      expect(state.items).toEqual(save.items.map((id) => itemMaster[id].name))
    }
  })

  it('チェックサムが合わないじゅもんを検出する', () => {
    expect(decodePassword('ああああああああああああああああああああ').checksumValid).toBe(false)
  })

  it('文字数・文字が不正なら Error', () => {
    expect(() => decodePassword('あいう')).toThrow(Error)
    expect(() => decodePassword('ぱああああああああああああああああああ')).toThrow(Error)
  })
})
