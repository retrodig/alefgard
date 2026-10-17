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

// ===== オートせんとう =====

const AUTO_KEY = 'alefgard:battle:auto'

export const AUTO_COUNT_MAX = 100

export interface AutoBattleSetting {
  enabled: boolean
  /** たたかう かいすう（1〜100） */
  count: number
  /** 画面で たたかわず、まとめて けっか だけ だす */
  resultOnly: boolean
  /** まけたら そこで とめる */
  stopOnLoss: boolean
}

export const DEFAULT_AUTO_BATTLE: AutoBattleSetting = { enabled: false, count: 10, resultOnly: false, stopOnLoss: true }

export function clampAutoCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_AUTO_BATTLE.count
  return Math.min(Math.max(Math.round(value), 1), AUTO_COUNT_MAX)
}

export function loadAutoBattle(): AutoBattleSetting {
  try {
    const parsed: unknown = JSON.parse(read(AUTO_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object') return DEFAULT_AUTO_BATTLE
    const { enabled, count, resultOnly, stopOnLoss } = parsed as Record<string, unknown>
    return {
      enabled: enabled === true,
      count: clampAutoCount(Number(count)),
      resultOnly: resultOnly === true,
      stopOnLoss: stopOnLoss !== false,
    }
  } catch {
    return DEFAULT_AUTO_BATTLE
  }
}

export function storeAutoBattle(setting: AutoBattleSetting): void {
  write(AUTO_KEY, JSON.stringify(setting))
}

// ===== けいけんち・ゴールドを たすか =====

const REWARDS_KEY = 'alefgard:battle:rewards'

/** 勝ったときに けいけんち・ゴールドを ゆうしゃに たすか（はじめは たす） */
export function loadGainRewards(): boolean {
  return read(REWARDS_KEY) !== 'off'
}

export function storeGainRewards(gain: boolean): void {
  write(REWARDS_KEY, gain ? 'on' : 'off')
}

// ===== じゅんび の オプションの ひらき ぐあい =====

const OPTIONS_OPEN_KEY = 'alefgard:battle:options-open'

export function loadOptionsOpen(): boolean {
  return read(OPTIONS_OPEN_KEY) === 'true'
}

export function storeOptionsOpen(open: boolean): void {
  write(OPTIONS_OPEN_KEY, String(open))
}
