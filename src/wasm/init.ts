import init, { WasmGame } from 'damdara'
import wasmUrl from 'damdara/damdara_bg.wasm?url'
import { DamdaraGame } from './game'
import type { EnemySpriteSummary, EquipmentData, MonsterData, SpellData, StatusData } from './types'

let ready: Promise<void> | null = null

/**
 * WASM を一度だけ初期化する。
 * 失敗した Promise もそのまま保持する（作り直すと React の use() が毎回新しい Promise で
 * 待ち続けてしまい、エラー画面に進めないため）。再試行はページの再読み込みで行う。
 */
export function initDamdara(): Promise<void> {
  ready ??= init({ module_or_path: wasmUrl }).then(() => undefined)
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
  enemySprites: EnemySpriteSummary[]
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
        enemySprites: game.getEnemySprites(),
      }
    } finally {
      game.free()
    }
  }
  return masterData
}

const spriteImages = new Map<number, ImageData | null>()

/** 敵スプライトを Canvas に描ける ImageData にして返す（モンスターごとにキャッシュ）。無ければ null */
export function getEnemySpriteImage(id: number): ImageData | null {
  if (!spriteImages.has(id)) {
    const summary = getMasterData().enemySprites.find((s) => s.id === id)
    let image: ImageData | null = null
    if (summary) {
      const game = createGame()
      try {
        const rgba = game.getEnemySpriteRgba(id)
        image = new ImageData(new Uint8ClampedArray(rgba), summary.width, summary.height)
      } catch {
        image = null
      } finally {
        game.free()
      }
    }
    spriteImages.set(id, image)
  }
  return spriteImages.get(id) ?? null
}
