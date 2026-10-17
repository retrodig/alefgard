// ものがたりの すすみぐあい（じゅもんに はいらない もの）を ブラウザに保存する。

import type { StoryState } from '../../wasm/types'

const STORY_KEY = 'alefgard:world:story'

export const STORY_FLAGS = [
  { key: 'left_throne_room', label: 'おうのまを でた' },
  { key: 'carrying_princess', label: 'ローラひめを だいている' },
  { key: 'princess_delivered', label: 'ローラひめを おしろに とどけた' },
  { key: 'dragonlord_defeated', label: 'りゅうおうを たおした' },
] as const satisfies readonly { key: keyof StoryState; label: string }[]

export type Story = Required<StoryState>

/** はじめは おうのまを でた ところ */
export const DEFAULT_STORY: Story = {
  left_throne_room: true,
  carrying_princess: false,
  princess_delivered: false,
  dragonlord_defeated: false,
}

export function loadStory(): Story {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORY_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STORY
    const values = parsed as Record<string, unknown>
    return Object.fromEntries(
      STORY_FLAGS.map(({ key }) => [key, typeof values[key] === 'boolean' ? values[key] : DEFAULT_STORY[key]]),
    ) as Story
  } catch {
    return DEFAULT_STORY
  }
}

export function storeStory(story: Story): void {
  try {
    localStorage.setItem(STORY_KEY, JSON.stringify(story))
  } catch {
    // 保存できない環境では何もしない
  }
}
