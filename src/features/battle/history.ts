// せんとうの きろく（ログ）。決着した せんとうの メッセージを ブラウザに保存して、あとから読めるようにする。

import type { BattleTurnResult } from '../../wasm/types'

export type BattleOutcome = 'win' | 'lose' | 'escape' | 'fled' | 'quit'

export const OUTCOME_LABEL: Record<BattleOutcome, string> = {
  win: 'かち',
  lose: 'まけ',
  escape: 'にげた',
  fled: 'にげられた',
  quit: 'やめた',
}

export interface BattleLogLine {
  turn: number
  text: string
}

export interface BattleRecord {
  id: string
  /** 決着した日時（ISO 8601） */
  at: string
  hero: string
  monster: string
  outcome: BattleOutcome
  turns: number
  log: BattleLogLine[]
}

/** 保存しておく せんとうの数（ふるいものから消す） */
export const HISTORY_MAX = 50

const HISTORY_KEY = 'alefgard:battle:history'

export function outcomeOf(result: BattleTurnResult): BattleOutcome {
  if (result.monster_defeated) return 'win'
  if (!result.player_survived) return 'lose'
  if (result.player_escaped) return 'escape'
  if (result.monster_escaped) return 'fled'
  return 'quit'
}

let sequence = 0

export function newRecordId(): string {
  sequence += 1
  return `${Date.now().toString(36)}-${sequence}`
}

function isRecord(value: unknown): value is BattleRecord {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.at === 'string' &&
    typeof r.hero === 'string' &&
    typeof r.monster === 'string' &&
    typeof r.outcome === 'string' &&
    r.outcome in OUTCOME_LABEL &&
    typeof r.turns === 'number' &&
    Array.isArray(r.log) &&
    r.log.every((line) => !!line && typeof line.turn === 'number' && typeof line.text === 'string')
  )
}

/** 新しい順の きろく。壊れたものは のぞく */
export function loadHistory(): BattleRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isRecord).slice(0, HISTORY_MAX) : []
  } catch {
    return []
  }
}

export function storeHistory(history: BattleRecord[]): void {
  try {
    if (history.length === 0) localStorage.removeItem(HISTORY_KEY)
    else localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)))
  } catch {
    // 保存できない環境では何もしない
  }
}

/** 新しい きろくを先頭に足す（HISTORY_MAX を こえた ふるいものは消す） */
export function addRecords(history: BattleRecord[], records: BattleRecord[]): BattleRecord[] {
  return [...[...records].reverse(), ...history].slice(0, HISTORY_MAX)
}
