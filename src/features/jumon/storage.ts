// ゆうしゃの状態（じゅもん）をブラウザに保存する。
// じゅもんに全パラメータが入っているので、保存するのはじゅもんの文字列だけでよい。

import { decodePassword } from './password'

const STORAGE_KEY = 'alefgard:jumon:last'

/** 保存済みの正しいじゅもんを返す。なければ（読めない・壊れている場合も）null */
export function loadStoredPassword(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return null
    decodePassword(value)
    return value
  } catch {
    return null
  }
}

export function storePassword(password: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, password)
  } catch {
    // プライベートブラウズなどで保存できない場合は何もしない
  }
}

export function clearStoredPassword(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 同上
  }
}

// ===== セーブスロット =====

export const SLOT_COUNT = 3
const SLOTS_KEY = 'alefgard:jumon:slots'

export interface SlotData {
  password: string
  /** 保存した日時（ISO 8601） */
  savedAt: string
}

export type Slots = (SlotData | null)[]

function isValidSlot(value: unknown): value is SlotData {
  if (!value || typeof value !== 'object') return false
  const { password, savedAt } = value as Record<string, unknown>
  if (typeof password !== 'string' || typeof savedAt !== 'string') return false
  try {
    decodePassword(password)
    return true
  } catch {
    return false
  }
}

/** スロットを読み出す。壊れたスロットは空として扱う */
export function loadSlots(): Slots {
  const empty: Slots = Array(SLOT_COUNT).fill(null)
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SLOTS_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return empty
    return empty.map((_, i) => (isValidSlot(parsed[i]) ? parsed[i] : null))
  } catch {
    return empty
  }
}

export function storeSlots(slots: Slots): void {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots))
  } catch {
    // 保存できない環境では何もしない
  }
}
