import init, { WasmGame } from 'damdara'
import wasmUrl from 'damdara/damdara_bg.wasm?url'
import { DamdaraGame } from './game'
import type { EquipmentData, MonsterData, SpellData, StatusData } from './types'

let ready: Promise<void> | null = null

/** WASM を一度だけ初期化する。失敗した場合は次回呼び出しで再試行する */
export function initDamdara(): Promise<void> {
  ready ??= init({ module_or_path: wasmUrl }).then(
    () => undefined,
    (e: unknown) => {
      ready = null
      throw e
    },
  )
  return ready
}

/** 初期化済みの前提で新しいゲームインスタンスを作る */
export function createGame(): DamdaraGame {
  return new DamdaraGame(new WasmGame())
}

export interface MasterData {
  monsters: MonsterData[]
  weapons: EquipmentData[]
  armors: EquipmentData[]
  shields: EquipmentData[]
  items: EquipmentData[]
  spells: SpellData[]
  statusTable: StatusData[]
}

let masterData: MasterData | null = null

/** 変化しないマスターデータを一度だけ読み出してキャッシュする（初期化済みの前提） */
export function getMasterData(): MasterData {
  if (!masterData) {
    const game = createGame()
    try {
      masterData = {
        monsters: game.getMonsters(),
        weapons: game.getWeapons(),
        armors: game.getArmors(),
        shields: game.getShields(),
        items: game.getItems(),
        spells: game.getSpells(),
        statusTable: game.getStatusTable(),
      }
    } finally {
      game.free()
    }
  }
  return masterData
}
