import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { Scan, ZoomIn, ZoomOut } from 'lucide-react'
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

export interface MarkView {
  x: number
  y: number
  label: string
}

export interface TreasureView extends MarkView {
  kind: 'chest' | 'hidden'
}

/** まものを しらべる モード（フィールド） */
export interface EncounterMode {
  /** くかくの 大きさ（タイル）。くかくの 線を ひく */
  zoneSize: number | null
  selected: { x: number; y: number } | null
  onSelect: (x: number, y: number) => void
}

interface Props {
  map: GameMapData
  spots: SpotView[]
  npcs: NpcView[]
  onSpot: (toMap: number) => void
  onTalk: (index: number) => void
  treasures?: TreasureView[]
  onTreasure?: (index: number) => void
  /** かならず まものが でる ばしょ */
  fixed?: MarkView[]
  onFixed?: (index: number) => void
  encounter?: EncounterMode | null
  /** じめんを クリックした（フィールドで ゆうしゃを おく） */
  onFieldClick?: (x: number, y: number) => void
  /** ゆうしゃ（key は おなじ 場所を もういちど クリックしても ズームしなおす ため） */
  hero?: { x: number; y: number; characterId: number; key: number } | null
  /** ふえるたびに 画面を ひからせる（イベントの えんしゅつ） */
  flash?: number
  /** マップの上に重ねるもの（メッセージウィンドウ など） */
  children?: React.ReactNode
}

/** あるく アニメーションの コマを かえる 間隔 */
const FRAME_INTERVAL_MS = 500

/** 拡大の だんかい */
const ZOOM_LEVELS = [1, 2, 3, 4, 6]
/** これだけ うごいたら ドラッグ（クリックでは ない）とみなす（px） */
const DRAG_THRESHOLD = 4

/** ゆうしゃへ ズームする ときの 拡大と、ズームに かける 時間 */
const FOCUS_ZOOM = 4
const ZOOM_DURATION_MS = 450

/** 拡大を かえる ときに 中心に のこす 位置（地図に たいする わりあい）と、それを 置く 枠の中の 位置（px） */
interface ZoomAnchor {
  fx: number
  fy: number
  px: number
  py: number
}

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
export function MapView({
  map,
  spots,
  npcs,
  onSpot,
  onTalk,
  treasures = [],
  onTreasure,
  fixed = [],
  onFixed,
  encounter,
  onFieldClick,
  hero,
  flash = 0,
  children,
}: Props) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (reduceMotion || npcs.length === 0) return
    const id = setInterval(() => setFrame((f) => 1 - f), FRAME_INTERVAL_MS)
    return () => clearInterval(id)
  }, [reduceMotion, npcs.length])

  const width = map.width * TILE_SIZE
  const height = map.height * TILE_SIZE

  // ===== 拡大・ドラッグで いどう =====
  // 拡大は 数値で もち、ボタン・ホイールでは ZOOM_LEVELS の だんかいへ、ゆうしゃの ときは ×4 へ なめらかに うごかす
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const viewportRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<ZoomAnchor | null>(null)
  const animationRef = useRef<number | null>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  // いまの 拡大に いちばん ちかい だんかい（ボタンの 有効・無効と つぎの だんかいに つかう）
  const levelIndex = ZOOM_LEVELS.reduce(
    (best, level, i) => (Math.abs(level - zoom) < Math.abs(ZOOM_LEVELS[best] - zoom) ? i : best),
    0,
  )

  /** target まで 拡大を かえる。地図の (fx, fy)（わりあい）が 枠の中の (toPx, toPy) に くるよう うごかす */
  const zoomTo = (target: number, fx: number, fy: number, toPx: number, toPy: number) => {
    const el = viewportRef.current
    if (!el) return
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    const from = zoomRef.current
    // いま その 場所が ある 位置から うごかしはじめる
    const fromPx = fx * el.scrollWidth - el.scrollLeft
    const fromPy = fy * el.scrollHeight - el.scrollTop
    if (reduceMotion) {
      anchorRef.current = { fx, fy, px: toPx, py: toPy }
      setZoom(target)
      return
    }
    const startedAt = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - startedAt) / ZOOM_DURATION_MS, 1)
      const eased = 1 - (1 - t) ** 3
      const anchor = { fx, fy, px: fromPx + (toPx - fromPx) * eased, py: fromPy + (toPy - fromPy) * eased }
      anchorRef.current = anchor
      if (target === from) {
        // 拡大が かわらない ときは 描きなおしが おきないので、ここで スクロールだけ うごかす
        el.scrollLeft = anchor.fx * el.scrollWidth - anchor.px
        el.scrollTop = anchor.fy * el.scrollHeight - anchor.py
      } else {
        setZoom(from + (target - from) * eased)
      }
      animationRef.current = t < 1 ? requestAnimationFrame(step) : null
    }
    animationRef.current = requestAnimationFrame(step)
  }

  useEffect(
    () => () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    },
    [],
  )

  /** だんかいを かえる。at（枠の中の 位置）が なければ 枠の まんなかを 中心に */
  const changeZoom = (delta: number, at?: { x: number; y: number }) => {
    const el = viewportRef.current
    const next = Math.min(Math.max(levelIndex + delta, 0), ZOOM_LEVELS.length - 1)
    if (!el || ZOOM_LEVELS[next] === zoomRef.current) return
    const px = at?.x ?? el.clientWidth / 2
    const py = at?.y ?? el.clientHeight / 2
    zoomTo(ZOOM_LEVELS[next], (el.scrollLeft + px) / el.scrollWidth, (el.scrollTop + py) / el.scrollHeight, px, py)
  }

  /** タイル (x, y) を 枠の まんなかに もってきて 拡大する */
  const focusOn = (x: number, y: number) => {
    const el = viewportRef.current
    if (!el) return
    const target = Math.max(zoomRef.current, FOCUS_ZOOM)
    zoomTo(target, (x + 0.5) / map.width, (y + 0.5) / map.height, el.clientWidth / 2, el.clientHeight / 2)
  }

  // 拡大した あとも 地図の おなじ 場所が おなじ 位置に くるよう スクロールを あわせる
  useLayoutEffect(() => {
    zoomRef.current = zoom
    const el = viewportRef.current
    const anchor = anchorRef.current
    if (!el || !anchor) return
    el.scrollLeft = anchor.fx * el.scrollWidth - anchor.px
    el.scrollTop = anchor.fy * el.scrollHeight - anchor.py
  }, [zoom])

  // ゆうしゃが あらわれたら そこへ ズームする
  const focusKey = hero ? `${hero.x},${hero.y},${hero.key}` : null
  const focusRef = useRef(focusOn)
  useLayoutEffect(() => {
    focusRef.current = focusOn
  })
  useEffect(() => {
    if (hero) focusRef.current(hero.x, hero.y)
    // ゆうしゃの いちが かわった ときだけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey])

  // じめんを クリック：ゆうしゃを おく（ボタン・まものを しらべる の ときは のぞく）
  const onContentClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onFieldClick || encounter || (e.target as HTMLElement).closest('button')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * map.width)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * map.height)
    onFieldClick(Math.min(Math.max(x, 0), map.width - 1), Math.min(Math.max(y, 0), map.height - 1))
  }

  // ctrl（⌘）＋ホイール・トラックパッドの ピンチで 拡大。
  // ブラウザ全体の 拡大を とめるため passive で ない リスナーで うける（React の onWheel は passive）
  const changeZoomRef = useRef(changeZoom)
  useLayoutEffect(() => {
    changeZoomRef.current = changeZoom
  })
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    let last = 0
    const onWheel = (e: globalThis.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      // ピンチは こまかい イベントが つづくので 間を あける
      if (e.timeStamp - last < 120) return
      last = e.timeStamp
      const rect = el.getBoundingClientRect()
      changeZoomRef.current(e.deltaY < 0 ? 1 : -1, { x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // マウスの ドラッグで いどう（タッチは ふつうの スクロール）
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current
    if (zoom <= 1 || e.pointerType !== 'mouse' || e.button !== 0 || !el) return
    dragRef.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop, moved: false }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const el = viewportRef.current
    if (!drag || !el) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!drag.moved) {
      drag.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    el.scrollLeft = drag.left - dx
    el.scrollTop = drag.top - dy
  }

  const endDrag = () => {
    setDragging(false)
    // ドラッグの あとの クリックは とりけす（onClickCapture で みる）ため、すこし のこす
    setTimeout(() => (dragRef.current = null), 0)
  }

  // クリックした ばしょの タイルを えらぶ
  const selectTile = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * map.width)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * map.height)
    encounter?.onSelect(Math.min(Math.max(x, 0), map.width - 1), Math.min(Math.max(y, 0), map.height - 1))
  }
  const zone = encounter?.zoneSize ?? null
  const selected = encounter?.selected ?? null

  return (
    <div className={styles.frame} style={{ '--w': width, '--h': height } as CSSProperties}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        data-zoomed={zoom > 1 || undefined}
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (dragRef.current?.moved) {
            e.stopPropagation()
            e.preventDefault()
          }
        }}
      >
        <div
          className={styles.content}
          style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
          data-walkable={(onFieldClick && !encounter) || undefined}
          onClick={onContentClick}
        >
          <ImageCanvas
            image={getMapImage(map.id)}
            // フィールドは 縮小して 見るので なめらかに、拡大したら ドットを くっきり
            className={map.id === WORLD_MAP_ID && zoom < 3 ? styles.mapImageSmooth : styles.mapImage}
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

          {treasures.map((treasure, i) => (
            <button
              key={`t:${treasure.x},${treasure.y}`}
              type="button"
              className={treasure.kind === 'chest' ? styles.chest : styles.hidden}
              style={tileStyle(treasure.x, treasure.y, map)}
              aria-label={treasure.label}
              title={treasure.label}
              onClick={() => onTreasure?.(i)}
            >
              {treasure.kind === 'hidden' && '？'}
            </button>
          ))}

          {fixed.map((mark, i) => (
            <button
              key={`f:${mark.x},${mark.y}`}
              type="button"
              className={styles.fixed}
              style={tileStyle(mark.x, mark.y, map)}
              aria-label={mark.label}
              title={mark.label}
              onClick={() => onFixed?.(i)}
            >
              ！
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

          {hero && (
            <div
              key={hero.key}
              className={styles.hero}
              style={tileStyle(hero.x, hero.y, map)}
              role="img"
              aria-label="ゆうしゃ"
            >
              <ImageCanvas image={getCharacterImage(hero.characterId, frame)} className={styles.npcImage} />
            </div>
          )}

          {encounter && (
            // まものを しらべる：くかくの 線を ひき、クリックで ばしょを えらぶ
            <div
              className={styles.encounterLayer}
              style={
                zone
                  ? ({
                      '--zone-x': `${(zone / map.width) * 100}%`,
                      '--zone-y': `${(zone / map.height) * 100}%`,
                    } as CSSProperties)
                  : undefined
              }
              data-zones={zone ? true : undefined}
              onClick={selectTile}
              aria-hidden
            >
              {selected && zone && (
                <span
                  className={styles.zoneSelected}
                  style={{
                    left: `${((Math.floor(selected.x / zone) * zone) / map.width) * 100}%`,
                    top: `${((Math.floor(selected.y / zone) * zone) / map.height) * 100}%`,
                    width: `${(zone / map.width) * 100}%`,
                    height: `${(zone / map.height) * 100}%`,
                  }}
                />
              )}
              {selected && <span className={styles.tileSelected} style={tileStyle(selected.x, selected.y, map)} />}
            </div>
          )}
        </div>
      </div>

      <div className={styles.zoomBar}>
        <button
          type="button"
          aria-label="ちいさく する"
          title="ちいさく する"
          disabled={levelIndex === 0}
          onClick={() => changeZoom(-1)}
        >
          <ZoomOut size={15} />
        </button>
        <span className={styles.zoomValue}>×{ZOOM_LEVELS[levelIndex]}</span>
        <button
          type="button"
          aria-label="おおきく する"
          title="おおきく する（ctrl＋ホイール でも）"
          disabled={levelIndex === ZOOM_LEVELS.length - 1}
          onClick={() => changeZoom(1)}
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          aria-label="もとの おおきさ"
          title="もとの おおきさ"
          disabled={levelIndex === 0}
          onClick={() => changeZoom(-levelIndex)}
        >
          <Scan size={15} />
        </button>
      </div>

      {flash > 0 && !reduceMotion && <div key={flash} className={styles.flash} aria-hidden />}

      {children}
    </div>
  )
}
