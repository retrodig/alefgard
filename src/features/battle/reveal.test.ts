import { describe, expect, it } from 'vitest'
import { nextReveal, revealLength, revealLines } from './reveal'

const lines = ['スライムが', '', 'あらわれた！']

describe('revealLength', () => {
  it('空行も 1 文字として数える', () => {
    expect(revealLength(lines)).toBe(5 + 1 + 6)
  })
})

describe('revealLines', () => {
  it('文字数ぶんだけ出す', () => {
    expect(revealLines(lines, 0)).toEqual([])
    expect(revealLines(lines, 3)).toEqual(['スライ'])
    expect(revealLines(lines, 5)).toEqual(['スライムが'])
    expect(revealLines(lines, 6)).toEqual(['スライムが', ''])
    expect(revealLines(lines, 8)).toEqual(['スライムが', '', 'あら'])
    expect(revealLines(lines, 99)).toEqual(lines)
  })
})

describe('nextReveal', () => {
  it('1 文字ずつ進める', () => {
    expect(nextReveal(lines, 3, false)).toBe(4)
  })

  it('1 行ずつのときは 行の終わりまで進める', () => {
    expect(nextReveal(lines, 0, true)).toBe(5)
    expect(nextReveal(lines, 3, true)).toBe(5)
    expect(nextReveal(lines, 5, true)).toBe(6)
    expect(nextReveal(lines, 6, true)).toBe(12)
  })
})
