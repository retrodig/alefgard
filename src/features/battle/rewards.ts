// せんとうで得た けいけんち・ゴールドを ゆうしゃの状態（じゅもん）に足す。
// damdara はターン制の戦闘で勝っても加算しないため、メッセージから読み取った値をこちらで足す。

import { LIMITS, type SaveData } from '../jumon/password'
import type { StatusData } from '../../wasm/types'
import type { BattleRewards } from './messages'

/** けいけんち から レベルを求める */
export function levelOf(experience: number, statusTable: StatusData[]): number {
  return statusTable.reduce((lv, s) => (experience >= s.required_exp ? s.level : lv), 1)
}

/** けいけんち・ゴールドを足す（上限 65535） */
export function applyRewards(save: SaveData, rewards: BattleRewards): SaveData {
  return {
    ...save,
    experience: Math.min(save.experience + rewards.exp, LIMITS.experience),
    gold: Math.min(save.gold + rewards.gold, LIMITS.gold),
  }
}
