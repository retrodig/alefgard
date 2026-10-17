import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SAVE, encodePassword } from './password'
import { clearStoredPassword, loadSlots, loadStoredPassword, SLOT_COUNT, storePassword, storeSlots } from './storage'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  }
}

describe('じゅもんの保存', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))
  afterEach(() => vi.unstubAllGlobals())

  it('保存したじゅもんを読み出せる', () => {
    const password = encodePassword({ ...DEFAULT_SAVE, gold: 1234 })
    storePassword(password)
    expect(loadStoredPassword()).toBe(password)
  })

  it('保存がない・壊れている場合は null', () => {
    expect(loadStoredPassword()).toBeNull()
    localStorage.setItem('alefgard:jumon:last', 'こわれたじゅもん')
    expect(loadStoredPassword()).toBeNull()
  })

  it('削除できる', () => {
    storePassword(encodePassword(DEFAULT_SAVE))
    clearStoredPassword()
    expect(loadStoredPassword()).toBeNull()
  })

  it('localStorage が使えない環境でも例外を出さない', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(() => storePassword('あ')).not.toThrow()
    expect(loadStoredPassword()).toBeNull()
  })
})

describe('セーブスロット', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))
  afterEach(() => vi.unstubAllGlobals())

  it('はじめは 3 つとも空', () => {
    expect(loadSlots()).toEqual(Array(SLOT_COUNT).fill(null))
  })

  it('保存したスロットを読み出せる', () => {
    const slot = { password: encodePassword({ ...DEFAULT_SAVE, gold: 99 }), savedAt: '2026-10-17T12:00:00.000Z' }
    storeSlots([null, slot, null])
    expect(loadSlots()).toEqual([null, slot, null])
  })

  it('壊れたスロットや余分な要素は無視する', () => {
    const valid = { password: encodePassword(DEFAULT_SAVE), savedAt: '2026-10-17T12:00:00.000Z' }
    localStorage.setItem(
      'alefgard:jumon:slots',
      JSON.stringify([{ password: 'こわれた', savedAt: 'x' }, valid, 'abc', valid]),
    )
    expect(loadSlots()).toEqual([null, valid, null])
  })

  it('JSON として読めなければ すべて空', () => {
    localStorage.setItem('alefgard:jumon:slots', '{')
    expect(loadSlots()).toEqual([null, null, null])
  })
})
