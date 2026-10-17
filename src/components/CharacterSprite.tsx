import { useEffect, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useDamdara } from '../wasm/useDamdara'
import { getCharacterImage, TILE_SIZE } from '../wasm/world'
import { ImageCanvas } from './ImageCanvas'
import styles from './CharacterSprite.module.css'

interface Props {
  /** damdara の キャラクター id（4：おうさま、5：ろうじん など） */
  characterId: number
  label: string
  /** 拡大の 倍率（16 ドット × scale px） */
  scale?: number
}

/** あるく アニメーションの コマを かえる 間隔 */
const FRAME_INTERVAL_MS = 500

/** damdara の キャラクターの絵（2 コマで あしぶみ） */
export function CharacterSprite({ characterId, label, scale = 2 }: Props) {
  useDamdara()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => setFrame((f) => 1 - f), FRAME_INTERVAL_MS)
    return () => clearInterval(id)
  }, [reduceMotion])

  const size = TILE_SIZE * scale
  return (
    <ImageCanvas
      image={getCharacterImage(characterId, reduceMotion ? 0 : frame)}
      className={styles.sprite}
      style={{ width: size, height: size }}
      label={label}
    />
  )
}
