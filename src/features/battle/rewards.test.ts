import { describe, expect, it } from 'vitest'
import { DEFAULT_SAVE } from '../jumon/password'
import type { StatusData } from '../../wasm/types'
import { applyRewards, levelOf } from './rewards'

const table = [
  { level: 1, required_exp: 0 },
  { level: 2, required_exp: 7 },
  { level: 3, required_exp: 23 },
] as StatusData[]

describe('levelOf', () => {
  it('けいけんち から レベルを求める', () => {
    expect(levelOf(0, table)).toBe(1)
    expect(levelOf(6, table)).toBe(1)
    expect(levelOf(7, table)).toBe(2)
    expect(levelOf(100, table)).toBe(3)
  })
})

describe('applyRewards', () => {
  it('けいけんち・ゴールドを足す', () => {
    const save = { ...DEFAULT_SAVE, experience: 10, gold: 20 }
    expect(applyRewards(save, { exp: 5, gold: 9 })).toMatchObject({ experience: 15, gold: 29 })
  })

  it('65535 で止まる', () => {
    const save = { ...DEFAULT_SAVE, experience: 65530, gold: 65000 }
    expect(applyRewards(save, { exp: 100, gold: 1000 })).toMatchObject({ experience: 65535, gold: 65535 })
  })
})
