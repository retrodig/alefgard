import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Palette, Scan, ZoomIn, ZoomOut } from 'lucide-react'
import { MonsterSprite } from './MonsterSprite'
import styles from './SpriteViewer.module.css'

interface Props {
  monsterId: number
  label: string
  /** large：ゲームの 3 ばい（くわしい 画面 など） */
  size?: 'normal' | 'large'
}

/** 拡大の段階（ドットがそろうよう整数倍） */
const ZOOM_LEVELS = [1, 2, 3, 4, 6]
/** 矢印キーで動かす量（px） */
const KEY_STEP = 16

interface Offset {
  x: number
  y: number
}

/** 背景色のプリセット。checker は透明部分が分かる市松模様 */
const BACKGROUNDS = [
  { id: 'black', label: 'くろ', value: '#000000' },
  { id: 'navy', label: 'こん', value: '#101c3c' },
  { id: 'gray', label: 'グレー', value: '#7c7c7c' },
  { id: 'white', label: 'しろ', value: '#fcfcfc' },
  { id: 'checker', label: 'もよう', value: 'checker' },
] as const

const BG_KEY = 'alefgard:sprite-bg'
const DEFAULT_BG = '#000000'

function loadBackground(): string {
  try {
    return localStorage.getItem(BG_KEY) ?? DEFAULT_BG
  } catch {
    return DEFAULT_BG
  }
}

function saveBackground(value: string) {
  try {
    localStorage.setItem(BG_KEY, value)
  } catch {
    // 保存できない環境では毎回くろから始める
  }
}

function backgroundStyle(value: string) {
  if (value === 'checker') {
    return {
      backgroundColor: '#c8c8c8',
      backgroundImage:
        'linear-gradient(45deg, #9a9a9a 25%, transparent 25%, transparent 75%, #9a9a9a 75%), linear-gradient(45deg, #9a9a9a 25%, transparent 25%, transparent 75%, #9a9a9a 75%)',
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 8px 8px',
    }
  }
  return { backgroundColor: value }
}

/**
 * モンスターの絵を拡大・移動して見るビューア。
 * 虫眼鏡ボタンで拡大縮小し、拡大中はドラッグ（または矢印キー）で表示位置を動かせる。
 */
export function SpriteViewer({ monsterId, label, size = 'normal' }: Props) {
  const [levelIndex, setLevelIndex] = useState(0)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [background, setBackground] = useState(loadBackground)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const colorId = useId()
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerX: number; pointerY: number; origin: Offset } | null>(null)

  const zoom = ZOOM_LEVELS[levelIndex]
  const zoomed = zoom > 1

  /** 絵が枠の外へ行き過ぎないよう、移動量を絵の大きさの範囲に収める */
  const clamp = (next: Offset, z = zoom): Offset => {
    const el = viewportRef.current
    if (!el || z === 1) return { x: 0, y: 0 }
    const maxX = (el.clientWidth * z) / 2
    const maxY = (el.clientHeight * z) / 2
    return {
      x: Math.min(Math.max(next.x, -maxX), maxX),
      y: Math.min(Math.max(next.y, -maxY), maxY),
    }
  }

  const changeZoom = (delta: number) => {
    const nextIndex = Math.min(Math.max(levelIndex + delta, 0), ZOOM_LEVELS.length - 1)
    const ratio = ZOOM_LEVELS[nextIndex] / zoom
    setLevelIndex(nextIndex)
    // 見ている場所が中央に残るよう、移動量も倍率に合わせる
    setOffset((o) => clamp({ x: o.x * ratio, y: o.y * ratio }, ZOOM_LEVELS[nextIndex]))
  }

  const changeBackground = (value: string) => {
    setBackground(value)
    saveBackground(value)
  }

  const reset = () => {
    setLevelIndex(0)
    setOffset({ x: 0, y: 0 })
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!zoomed) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { pointerX: e.clientX, pointerY: e.clientY, origin: offset }
    setDragging(true)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    setOffset(clamp({ x: drag.origin.x + e.clientX - drag.pointerX, y: drag.origin.y + e.clientY - drag.pointerY }))
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '+' || e.key === '=') return changeZoom(1)
    if (e.key === '-') return changeZoom(-1)
    if (e.key === '0') return reset()
    if (!zoomed) return
    const moves: Record<string, Offset> = {
      ArrowUp: { x: 0, y: KEY_STEP },
      ArrowDown: { x: 0, y: -KEY_STEP },
      ArrowLeft: { x: KEY_STEP, y: 0 },
      ArrowRight: { x: -KEY_STEP, y: 0 },
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    setOffset((o) => clamp({ x: o.x + move.x, y: o.y + move.y }))
  }

  return (
    <div className={styles.viewer} style={backgroundStyle(background)} data-size={size}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        data-zoomed={zoomed || undefined}
        data-dragging={dragging || undefined}
        tabIndex={0}
        aria-label={`${label}の すがた（＋−で拡大縮小、拡大中はドラッグや矢印キーで移動）`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.content} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
          <MonsterSprite monsterId={monsterId} label={label} mode="stage" className={styles.stage} />
        </div>
      </div>

      {paletteOpen && (
        <div className={styles.palette} role="group" aria-label="はいけいしょく">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              className={styles.swatch}
              style={backgroundStyle(bg.value)}
              aria-label={bg.label}
              title={bg.label}
              aria-pressed={background === bg.value}
              onClick={() => changeBackground(bg.value)}
            />
          ))}
          <label className={styles.customColor} title="すきな いろ">
            <span className={styles.visuallyHidden}>すきな いろ</span>
            <input
              id={colorId}
              type="color"
              value={background === 'checker' ? '#000000' : background}
              onChange={(e) => changeBackground(e.target.value)}
            />
          </label>
        </div>
      )}

      <div className={styles.toolbar}>
        <button
          type="button"
          data-variant="ghost"
          aria-label="はいけいしょく"
          title="はいけいしょく"
          aria-expanded={paletteOpen}
          onClick={() => setPaletteOpen((open) => !open)}
        >
          <Palette size={16} />
        </button>
        <button
          type="button"
          data-variant="ghost"
          aria-label="しゅくしょう"
          title="しゅくしょう"
          disabled={levelIndex === 0}
          onClick={() => changeZoom(-1)}
        >
          <ZoomOut size={16} />
        </button>
        <span className={styles.zoomLabel} aria-live="polite">
          ×{zoom}
        </span>
        <button
          type="button"
          data-variant="ghost"
          aria-label="かくだい"
          title="かくだい"
          disabled={levelIndex === ZOOM_LEVELS.length - 1}
          onClick={() => changeZoom(1)}
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          data-variant="ghost"
          aria-label="もとに もどす"
          title="もとに もどす"
          disabled={!zoomed && offset.x === 0 && offset.y === 0}
          onClick={reset}
        >
          <Scan size={16} />
        </button>
      </div>
    </div>
  )
}
