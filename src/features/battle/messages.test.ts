import { describe, expect, it } from 'vitest'
import { cleanBattleMessages } from './messages'

describe('cleanBattleMessages', () => {
  it('メニューと HP 表示を除き、なまえの濁点を結合する', () => {
    const raw = [
      '\n--- た゛い　のターン ---',
      'コマンド？',
      '1: たたかう',
      '2: じゅもん',
      'た゛い　 のこうげき！',
      'りゅうおうに 32ポイントの',
      'ダメージを あたえた！',
      ' りゅうおうは ',
      ' ほのおをはいた!',
      '',
      ' た゛い　は 43ポイントの',
      ' ダメージを うけた！',
      '',
      'た゛い　 HP: 147 MP: 194',
      'りゅうおう HP: 97',
      '',
    ]
    expect(cleanBattleMessages(raw)).toEqual([
      'だい のこうげき！',
      'りゅうおうに 32ポイントの',
      'ダメージを あたえた！',
      'りゅうおうは',
      'ほのおをはいた!',
      '',
      'だい は 43ポイントの',
      'ダメージを うけた！',
    ])
  })

  it('出現メッセージから HP 表示を除く', () => {
    expect(cleanBattleMessages(['りゅうおうがあらわれた！', '', 'た゛い　 HP: 190 MP: 200', 'りゅうおう HP: 129', ''])).toEqual([
      'りゅうおうがあらわれた！',
    ])
  })
})
