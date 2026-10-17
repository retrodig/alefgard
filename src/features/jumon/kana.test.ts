import { describe, expect, it } from 'vitest'
import { chunkPassword, formatName, normalizeName, normalizePassword } from './kana'

describe('normalizePassword', () => {
  it('空白・改行を除き、カタカナをひらがなにする', () => {
    const r = normalizePassword('コグリギザ ぶそわげげ\nぬきそてぬ　ひでほるが')
    expect(r.value).toBe('こぐりぎざぶそわげげぬきそてぬひでほるが')
    expect(r.complete).toBe(true)
  })

  it('分かれた濁点・半角カナを結合する', () => {
    expect(normalizePassword('か゛がｶﾞ').value).toBe('ががが')
  })

  it('使えない文字と文字数不足を検出する', () => {
    const r = normalizePassword('あぱ')
    expect(r.chars.map((c) => c.valid)).toEqual([true, false])
    expect(r.complete).toBe(false)
  })
})

describe('normalizeName', () => {
  it('濁点を分けた形にする', () => {
    expect(normalizeName('だい').value).toBe('た゛い')
    expect(normalizeName('ダイ').value).toBe('た゛い')
  })

  it('濁点を 1 文字として数える', () => {
    expect(normalizeName('だいだ').valid).toBe(false)
    expect(normalizeName('ゆうてい').valid).toBe(true)
  })

  it('数字・のばし棒を全角にそろえる', () => {
    expect(normalizeName('1ー').value).toBe('１－')
  })

  it('空・使えない文字は無効', () => {
    expect(normalizeName('').valid).toBe(false)
    expect(normalizeName('AB').valid).toBe(false)
  })
})

describe('formatName', () => {
  it('濁点を結合し、末尾の空白を除く', () => {
    expect(formatName('た゛い　')).toBe('だい')
    expect(formatName('は゜ひ゜')).toBe('ぱぴ')
  })
})

describe('chunkPassword', () => {
  it('5 文字ずつ区切る', () => {
    expect(chunkPassword('あいうえおかきくけこさしすせそたちつてと')).toEqual([
      'あいうえお',
      'かきくけこ',
      'さしすせそ',
      'たちつてと',
    ])
  })
})
