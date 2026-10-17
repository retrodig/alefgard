import { describe, expect, it } from 'vitest'
import { clampAutoCount } from './storage'

describe('clampAutoCount', () => {
  it('1〜100 の整数にする', () => {
    expect(clampAutoCount(0)).toBe(1)
    expect(clampAutoCount(5.6)).toBe(6)
    expect(clampAutoCount(500)).toBe(100)
    expect(clampAutoCount(NaN)).toBe(10)
  })
})
