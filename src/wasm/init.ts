import init, { WasmGame } from 'damdara'
import wasmUrl from 'damdara/damdara_bg.wasm?url'
import { DamdaraGame } from './game'
import type { BattleBackgroundData, EnemySpriteSummary, EquipmentData, MonsterData, SpellData, StatusData } from './types'

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
  /** フィールド（マップ 1）の せんとうの はいけい */
  fieldBackground: BattleBackgroundData | null
  /** はいけいの無いせんとうの色（CSS の色） */
  backdropColor: string
}

/** せんとうの はいけいがあるマップ（フィールド） */
export const FIELD_MAP_ID = 1

let masterData: MasterData | null = null

function toCssColor(rgb: [number, number, number] | undefined): string {
  return rgb ? `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})` : '#000'
}

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
        fieldBackground: game.getBattleBackground(FIELD_MAP_ID),
        backdropColor: toCssColor(game.getNesPalette()[game.getBattleBackdrop()]),
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

const backgroundImages = new Map<string, ImageData>()

/**
 * フィールドの せんとうの はいけいを ImageData にして返す。
 * revealBlocks を渡すと そのブロック数だけ描いた途中の絵になる（出現アニメーション用）。無ければ null
 */
export function getBattleBackgroundImage(revealBlocks?: number): ImageData | null {
  const bg = getMasterData().fieldBackground
  if (!bg) return null
  const key = String(revealBlocks ?? 'all')
  let image = backgroundImages.get(key)
  if (!image) {
    const game = createGame()
    try {
      const rgba = game.getBattleBackgroundRgba(FIELD_MAP_ID, revealBlocks)
      image = new ImageData(new Uint8ClampedArray(rgba), bg.width, bg.height)
    } finally {
      game.free()
    }
    backgroundImages.set(key, image)
  }
  return image
}
