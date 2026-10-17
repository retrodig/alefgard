import { describe, expect, it } from 'vitest'
import type { EventStep, TalkData } from '../../wasm/types'
import { dialogueBeforeAction, shopConversation } from './conversation'

const dialogues = new Map([
  [11, 'やどや　ひとばん　{number}ゴールド'],
  [9, 'おやすみ'],
  [8, 'おはよう'],
  [10, 'さようなら'],
  [40, 'ぶきや'],
])
const dialogue = (id: number) => dialogues.get(id)

function talk(kind: TalkData['kind'], extra: Partial<TalkData> = {}): TalkData {
  return { talk_id: 0, kind, items: [], related_dialogue_ids: [], ...extra }
}

describe('shopConversation', () => {
  it('やどや：ねだんを入れて しつもんし、こたえで つづきが かわる', () => {
    const inn = talk('inn', { price: 20 })
    expect(shopConversation(inn, [], dialogue)).toMatchObject({
      texts: ['やどや　ひとばん　20ゴールド'],
      status: 'waiting_answer',
    })
    expect(shopConversation(inn, [true], dialogue).texts).toEqual([
      'やどや　ひとばん　20ゴールド',
      'おやすみ',
      'おはよう',
    ])
    expect(shopConversation(inn, [false], dialogue)).toMatchObject({
      texts: ['やどや　ひとばん　20ゴールド', 'さようなら'],
      status: 'finished',
    })
  })

  it('ぶきや：あいさつと しなもの', () => {
    const items = [{ kind: 'weapon' as const, index: 3, name: 'どうのつるぎ', price: 180 }]
    expect(shopConversation(talk('weapon_shop', { items }), [], dialogue)).toMatchObject({
      texts: ['ぶきや'],
      status: 'finished',
      shopItems: items,
    })
  })
})

describe('dialogueBeforeAction', () => {
  it('action の すぐ前の セリフを さがす（えだの 中も）', () => {
    const steps: EventStep[] = [
      { type: 'say', dialogue_id: 1 },
      {
        type: 'if',
        condition: { type: 'max_level' },
        then: [{ type: 'say', dialogue_id: 2 }],
        otherwise: [
          { type: 'say', dialogue_id: 3 },
          { type: 'do', action: { type: 'tell_password' } },
        ],
      },
    ]
    expect(dialogueBeforeAction(steps, 'tell_password')).toBe(3)
    expect(dialogueBeforeAction(steps, 'battle')).toBeNull()
  })
})
