// せんとうの設定をブラウザに保存する（メッセージの はやさ・さいごに えらんだ モンスター）。

import { DEFAULT_MESSAGE_SPEED, MESSAGE_SPEEDS, type MessageSpeed } from './reveal'

const SPEED_KEY = 'alefgard:message-speed'
const MONSTER_KEY = 'alefgard:battle:monster'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // プライベートブラウズなどで保存できない場合は何もしない
  }
}

export function loadMessageSpeed(): MessageSpeed {
  const value = read(SPEED_KEY)
  return MESSAGE_SPEEDS.find((s) => s.id === value)?.id ?? DEFAULT_MESSAGE_SPEED
}

export function storeMessageSpeed(speed: MessageSpeed): void {
  write(SPEED_KEY, speed)
}

/** さいごに えらんだ モンスターの id。なければ（壊れている場合も）null */
export function loadLastMonster(): number | null {
  const value = Number(read(MONSTER_KEY) ?? NaN)
  return Number.isInteger(value) && value >= 0 ? value : null
}

export function storeLastMonster(id: number): void {
  write(MONSTER_KEY, String(id))
}
