import { describe, expect, it } from 'vitest'
import type { WarpData } from '../../wasm/types'
import { dialoguePages } from './dialogue'
import { mapSpots } from './spots'

describe('dialoguePages', () => {
  it('▼ で ページを分け、改行で 行に分ける', () => {
    const text =
      '＊「はしに　きをつけろ！\n▼＊「はしをわたって　とおくにいくほど\nおそろしい　まものたちが\nあらわれるだろう。'
    expect(dialoguePages(text, 'ゆうてい')).toEqual([
      ['＊「はしに　きをつけろ！'],
      ['＊「はしをわたって　とおくにいくほど', 'おそろしい　まものたちが', 'あらわれるだろう。'],
    ])
  })

  it('{player} を なまえに、{word} を 〇〇 にし、{wait} を けす', () => {
    expect(dialoguePages('{player}は　{word}を　てにいれた！\n{wait}', 'ゆうてい')).toEqual([
      ['ゆうていは　〇〇を　てにいれた！'],
    ])
  })
})

describe('mapSpots', () => {
  const warps: WarpData[] = [
    { from: [1, 43, 43], to: [4, 11, 29] },
    { from: [4, 29, 29], to: [12, 0, 4] },
    { from: [20, 9, 0], to: [20, 0, 0] },
  ]

  it('フィールドからの いりぐち', () => {
    expect(mapSpots(1, warps)).toEqual([{ x: 43, y: 43, toMap: 4 }])
  })

  it('なかの マップでは でぐち（もどり）と かいだんの りょうほう', () => {
    expect(mapSpots(4, warps)).toEqual([
      { x: 11, y: 29, toMap: 1 },
      { x: 29, y: 29, toMap: 12 },
    ])
  })

  it('おなじ マップ内の ワープは のぞく', () => {
    expect(mapSpots(20, warps)).toEqual([])
  })
})
