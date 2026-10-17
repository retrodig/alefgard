// マップの中で クリックすると ほかの マップへ いける ばしょ（いりぐち・かいだん）。

import type { WarpData } from '../../wasm/types'

export interface MapSpot {
  x: number
  y: number
  /** いき先の マップ id */
  toMap: number
}

/**
 * そのマップの いりぐち・かいだん。
 * ワープの「もと」は いき先へ、「さき」は もとの マップへ もどる ばしょになる（おなじ マップ内の ワープは のぞく）。
 * おなじ ばしょに いくつも あるときは さいしょの ものだけ。
 */
export function mapSpots(mapId: number, warps: WarpData[]): MapSpot[] {
  const spots: MapSpot[] = []
  const seen = new Set<string>()
  const add = (x: number, y: number, toMap: number) => {
    const key = `${x},${y}`
    if (toMap === mapId || seen.has(key)) return
    seen.add(key)
    spots.push({ x, y, toMap })
  }
  for (const { from, to } of warps) {
    if (from[0] === mapId) add(from[1], from[2], to[0])
    if (to[0] === mapId) add(to[1], to[2], from[0])
  }
  return spots
}
