import { useEffect, useRef } from 'react'
import { useDamdara } from '../wasm/useDamdara'
import styles from './MonsterSprite.module.css'

/** せんとう画面でモンスターを置く範囲（ゲーム画面の座標）。全モンスターがこの中に収まる */
const STAGE = { x: 88, y: 60, width: 96, height: 104 }

interface Props {
  monsterId: number
  /** 代替テキスト（モンスター名） */
  label: string
  /**
   * stage：ゲームと同じ位置関係で、決まった大きさの枠に描く（せんとう画面用）
   * fit：絵の部分だけを切り出し、size px の枠に収める（一覧用）
   */
  mode?: 'stage' | 'fit'
  /** fit のときの枠の大きさ（px） */
  size?: number
  className?: string
}

/** damdara の敵スプライトを Canvas に描く */
export function MonsterSprite({ monsterId, label, mode = 'fit', size = 40, className }: Props) {
  const { getMasterData, getEnemySpriteImage } = useDamdara()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const summary = getMasterData().enemySprites.find((s) => s.id === monsterId)

  useEffect(() => {
    const canvas = canvasRef.current
    const image = getEnemySpriteImage(monsterId)
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image || !summary) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (mode === 'stage') {
      ctx.putImageData(image, summary.x - STAGE.x, summary.y - STAGE.y)
    } else {
      ctx.putImageData(image, 0, 0)
    }
  }, [monsterId, mode, summary, getEnemySpriteImage])

  if (!summary) return null

  if (mode === 'stage') {
    return (
      <canvas
        ref={canvasRef}
        width={STAGE.width}
        height={STAGE.height}
        className={[styles.sprite, styles.stage, className].filter(Boolean).join(' ')}
        role="img"
        aria-label={label}
      />
    )
  }

  // 枠に収まるよう整数倍で拡大する（小さい絵は大きく、大きい絵は縮小）
  const fitScale = size / Math.max(summary.width, summary.height)
  const scale = fitScale >= 1 ? Math.floor(fitScale) : fitScale
  return (
    <span className={[styles.fitBox, className].filter(Boolean).join(' ')} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={summary.width}
        height={summary.height}
        className={styles.sprite}
        style={{ width: summary.width * scale, height: summary.height * scale }}
        role="img"
        aria-label={label}
      />
    </span>
  )
}
