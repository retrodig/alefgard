import { useEffect, useState, type CSSProperties } from 'react'
import { ImageCanvas } from '../../components/ImageCanvas'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { GameMapData } from '../../wasm/types'
import { getCharacterImage, getMapImage, TILE_SIZE, WORLD_MAP_ID } from '../../wasm/world'
import styles from './World.module.css'

export interface SpotView {
  x: number
  y: number
  toMap: number
  label: string
}

export interface NpcView {
  index: number
  x: number
  y: number
  characterId: number
  name: string
}

interface Props {
  map: GameMapData
  spots: SpotView[]
  npcs: NpcView[]
  onSpot: (toMap: number) => void
  onTalk: (index: number) => void
  /** ふえるたびに 画面を ひからせる（イベントの えんしゅつ） */
  flash?: number
  /** マップの上に重ねるもの（メッセージウィンドウ など） */
  children?: React.ReactNode
}

/** あるく アニメーションの コマを かえる 間隔 */
const FRAME_INTERVAL_MS = 500

/** タイルの 位置を マップに たいする % にする */
function tileStyle(x: number, y: number, map: GameMapData): CSSProperties {
  return {
    left: `${(x / map.width) * 100}%`,
    top: `${(y / map.height) * 100}%`,
    width: `${100 / map.width}%`,
    height: `${100 / map.height}%`,
  }
}

/** マップ全体を 1 画面に おさめて描き、いりぐち・ひとを クリックできるようにする */
export function MapView({ map, spots, npcs, onSpot, onTalk, flash = 0, children }: Props) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (reduceMotion || npcs.length === 0) return
    const id = setInterval(() => setFrame((f) => 1 - f), FRAME_INTERVAL_MS)
    return () => clearInterval(id)
  }, [reduceMotion, npcs.length])

  const width = map.width * TILE_SIZE
  const height = map.height * TILE_SIZE

  return (
    <div className={styles.frame} style={{ '--w': width, '--h': height } as CSSProperties}>
      <ImageCanvas
        image={getMapImage(map.id)}
        className={map.id === WORLD_MAP_ID ? styles.mapImageSmooth : styles.mapImage}
        label={`${map.name}の ちず`}
      />

      {npcs.map((npc) => (
        <button
          key={npc.index}
          type="button"
          className={styles.npc}
          style={tileStyle(npc.x, npc.y, map)}
          aria-label={`${npc.name}と はなす`}
          title={npc.name}
          onClick={() => onTalk(npc.index)}
        >
          <ImageCanvas image={getCharacterImage(npc.characterId, frame)} className={styles.npcImage} />
        </button>
      ))}

      {spots.map((spot) => (
        <button
          key={`${spot.x},${spot.y}`}
          type="button"
          className={styles.spot}
          style={tileStyle(spot.x, spot.y, map)}
          aria-label={`${spot.label}へ いく`}
          onClick={() => onSpot(spot.toMap)}
        >
          <span className={styles.spotLabel}>{spot.label}</span>
        </button>
      ))}

      {flash > 0 && !reduceMotion && <div key={flash} className={styles.flash} aria-hidden />}

      {children}
    </div>
  )
}
