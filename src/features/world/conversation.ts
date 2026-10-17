// NPC との 会話を くみたてる。
// セリフ・しつもん・イベントは damdara の run_event、おみせ・やどや は damdara の セリフと ねだんで ここで くみたてる。

import type { EventAction, EventStep, ShopItemData, TalkData } from '../../wasm/types'

export interface Conversation {
  /** 出す セリフ（damdara の セリフ。▼ で ページが かわる） */
  texts: string[]
  status: 'finished' | 'waiting_answer'
  actions: EventAction[]
  /** おみせの しなもの（さいごの ページで 出す） */
  shopItems: ShopItemData[]
}

/** おみせ・やどや で つかう セリフ（damdara の セリフ id） */
const SHOP_SCRIPTS = {
  weapon_shop: { greeting: 40 },
  item_shop: { greeting: 37 },
  key_shop: { ask: 22, yes: [21], no: [18] },
  fairy_water_shop: { ask: 17, yes: [16], no: [12] },
  inn: { ask: 11, yes: [9, 8], no: [10] },
} as const

export function isShop(kind: TalkData['kind']): kind is keyof typeof SHOP_SCRIPTS {
  return kind in SHOP_SCRIPTS
}

/** おみせ・やどや の 会話。{number} は ねだん */
export function shopConversation(
  talk: TalkData,
  answers: boolean[],
  dialogue: (id: number) => string | undefined,
): Conversation {
  const say = (id: number) => (dialogue(id) ?? '').replaceAll('{number}', String(talk.price ?? ''))
  const base = { actions: [], shopItems: [] }
  if (!isShop(talk.kind)) return { ...base, texts: [], status: 'finished' }
  const script = SHOP_SCRIPTS[talk.kind]
  if ('greeting' in script) {
    return { ...base, texts: [say(script.greeting)], status: 'finished', shopItems: talk.items }
  }
  if (answers.length === 0) return { ...base, texts: [say(script.ask)], status: 'waiting_answer' }
  const reply = answers[0] ? script.yes : script.no
  return { ...base, texts: [say(script.ask), ...reply.map(say)], status: 'finished' }
}

/**
 * ステップの 木から、action の すぐ前に ある セリフの id を さがす
 * （ふっかつのじゅもん を どの セリフの あとに 出すか きめる ため）
 */
export function dialogueBeforeAction(steps: EventStep[], actionType: EventAction['type']): number | null {
  let previous: number | null = null
  for (const step of steps) {
    if (step.type === 'say') previous = step.dialogue_id
    if (step.type === 'do' && step.action.type === actionType) return previous
    const children =
      step.type === 'ask' || step.type === 'ask_until_yes'
        ? [step.yes, step.no]
        : step.type === 'if'
          ? [step.then, step.otherwise]
          : step.type === 'random'
            ? step.choices.map((c) => c.steps)
            : []
    for (const child of children) {
      const found = dialogueBeforeAction(child, actionType)
      if (found !== null) return found
    }
    if (step.type === 'ask' || step.type === 'ask_until_yes') previous = step.dialogue_id
  }
  return null
}
