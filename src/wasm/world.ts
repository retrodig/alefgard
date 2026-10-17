// せかい（マップ・NPC・セリフ）の データを 読み出して キャッシュする（WASM は初期化済みの前提）。
// どれも変わらないデータなので、読み出し用の ゲームインスタンスを 1 つだけ作って使い回す。

import type { DamdaraGame } from './game'
import { createGame } from './init'
import type { CharacterSpriteSummary, DialogueData, GameMapData, MapSummary, TalkData, WarpData } from './types'

/** タイル 1 まいの 大きさ（ドット） */
export const TILE_SIZE = 16

/** フィールド（アレフガルド）の マップ id */
export const WORLD_MAP_ID = 1

let reader: DamdaraGame | null = null

function game(): DamdaraGame {
  reader ??= createGame()
  return reader
}

export interface WorldData {
  maps: MapSummary[]
  warps: WarpData[]
  dialogues: Map<number, string>
  characters: CharacterSpriteSummary[]
  talks: Map<number, TalkData>
}

let world: WorldData | null = null

export function getWorldData(): WorldData {
  if (!world) {
    const g = game()
    world = {
      maps: g.getMaps(),
      warps: g.getWarps(),
      dialogues: new Map(g.getDialogues().map((d: DialogueData) => [d.id, d.text])),
      // 画素も ふくまれるので、なまえ だけ のこす
      characters: g.getCharacterSprites().map(({ id, name, name_en }) => ({ id, name, name_en })),
      talks: new Map(g.getTalks().map((t) => [t.talk_id, t])),
    }
  }
  return world
}

const maps = new Map<number, GameMapData>()

export function getMapData(id: number): GameMapData {
  let data = maps.get(id)
  if (!data) {
    data = game().getMap(id)
    maps.set(id, data)
  }
  return data
}

const mapImages = new Map<number, ImageData>()

/** マップ全体の絵 */
export function getMapImage(id: number): ImageData {
  let image = mapImages.get(id)
  if (!image) {
    const { width, height } = getMapData(id)
    const rgba = game().renderMapRgba(id, 0, 0, width, height)
    image = new ImageData(new Uint8ClampedArray(rgba), width * TILE_SIZE, height * TILE_SIZE)
    mapImages.set(id, image)
  }
  return image
}

/** NPC の絵の番号から キャラクター id を求める（afterEnding：りゅうおうを たおした あと） */
export function npcCharacterId(sprite: number, mapId: number, afterEnding = false): number {
  return game().npcCharacterId(sprite, mapId, afterEnding)
}

const characterImages = new Map<string, ImageData>()

/** キャラクターの 1 コマ（frame は 0 か 1） */
export function getCharacterImage(id: number, frame: number): ImageData {
  const key = `${id}:${frame}`
  let image = characterImages.get(key)
  if (!image) {
    const rgba = game().getCharacterSpriteRgba(id, frame)
    image = new ImageData(new Uint8ClampedArray(rgba), TILE_SIZE, TILE_SIZE)
    characterImages.set(key, image)
  }
  return image
}
