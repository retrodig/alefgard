import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { ScrollText, X } from 'lucide-react'
import { formatName } from '../../features/jumon/kana'
import type { CommandOption } from '../../features/battle/commands'
import { revealLength, revealLines } from '../../features/battle/reveal'
import type { BattleAction, BattleTurnResult } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import styles from './BattleScreen.module.css'

export interface LogLine {
  turn: number
  text: string
}

/** せんとうの ばしょ。フィールドは はいけいあり、それ以外は はいけいなし */
export type BattlePlace = 'field' | 'dungeon'

interface Props {
  result: BattleTurnResult
  /** 形態つきの表示名 */
  monsterLabel: string
  monsterMaxHp: number
  place: BattlePlace
  log: LogLine[]
  /** 表示済みの文字数（文字送りで表示する） */
  shown: number
  /** はいけいの出現アニメーションを省く */
  reduceMotion: boolean
  /** はいけいの出現が終わった */
  onIntroEnd: () => void
  onSkip: () => void
  spells: CommandOption[]
  items: CommandOption[]
  onCommand: (action: BattleAction, selection?: number) => void
  /** おなじ条件で もういちど たたかう */
  onRestart: () => void
  /** 戦闘をやめる */
  onQuit: () => void
  /** せんとうの きろくを ひらく */
  onOpenLog: () => void
  /** オートせんとう中なら その進みぐあい */
  auto: { count: number; total: number } | null
  /** オートを とめる（いまの せんとうは 手動で つづける） */
  onStopAuto: () => void
}

/** ゲーム画面（256 × 240）の上の位置と大きさ */
interface Box {
  x: number
  y: number
  width: number
  height?: number
}

const LAYOUT = {
  status: { x: 8, y: 32, width: 72, height: 96 },
  command: { x: 100, y: 16, width: 130, height: 48 },
  subMenu: { x: 124, y: 16, width: 120 },
  message: { x: 24, y: 144, width: 188, height: 80 },
} satisfies Record<string, Box>

/** はいけいを 1 ブロック出す間隔 */
const REVEAL_INTERVAL_MS = 16

const unit = (n: number) => `calc(var(--u) * ${n})`

function boxStyle({ x, y, width, height }: Box): CSSProperties {
  return {
    left: unit(x),
    top: unit(y),
    width: unit(width),
    height: height === undefined ? undefined : unit(height),
  }
}

/** ImageData をゲーム画面上の位置に描く Canvas */
function PixelCanvas({ image, x, y, className }: { image: ImageData; x: number; y: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    ref.current?.getContext('2d')?.putImageData(image, 0, 0)
  }, [image])
  return (
    <canvas
      ref={ref}
      width={image.width}
      height={image.height}
      className={[styles.pixels, className].filter(Boolean).join(' ')}
      style={boxStyle({ x, y, width: image.width, height: image.height })}
      aria-hidden
    />
  )
}

function RetroWindow({ title, box, children }: { title?: string; box: Box; children: ReactNode }) {
  return (
    <div className={styles.window} style={boxStyle(box)}>
      {title && <span className={styles.windowTitle}>{title}</span>}
      {children}
    </div>
  )
}

interface MenuItem {
  key: string
  label: string
  detail?: string
  disabled?: boolean
  title?: string
  run: () => void
}

type Menu = 'main' | 'spell' | 'item'

/** せんとう画面：ファミコン版と同じ配置で、ゆうしゃ・コマンド・はいけいとモンスター・メッセージを描く */
export function BattleScreen({
  result,
  monsterLabel,
  monsterMaxHp,
  place,
  log,
  shown,
  reduceMotion,
  onIntroEnd,
  onSkip,
  spells,
  items,
  onCommand,
  onRestart,
  onQuit,
  onOpenLog,
  auto,
  onStopAuto,
}: Props) {
  const { getMasterData, getEnemySpriteImage, getBattleBackgroundImage } = useDamdara()
  const { fieldBackground, backdropColor, enemySprites } = getMasterData()
  const background = place === 'field' ? fieldBackground : null
  const totalBlocks = background?.reveal_order.length ?? 0

  const [blocks, setBlocks] = useState(reduceMotion ? totalBlocks : 0)
  const [menu, setMenu] = useState<Menu>('main')
  const [cursor, setCursor] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const introDone = blocks >= totalBlocks
  const texts = log.map((line) => line.text)
  const busy = shown < revealLength(texts)
  const finished = result.is_finished
  const { summary, strength_status: st } = result.player_state
  const sprite = enemySprites.find((s) => s.id === result.monster_id)
  const spriteImage = getEnemySpriteImage(result.monster_id)

  // はいけいを中央から 1 ブロックずつ出し、出しきったら知らせる
  useEffect(() => {
    if (introDone) {
      onIntroEnd()
      return
    }
    const id = setTimeout(() => setBlocks((n) => n + 1), REVEAL_INTERVAL_MS)
    return () => clearTimeout(id)
  }, [blocks, introDone, onIntroEnd])

  // 新しいメッセージが出たら一番下までスクロールする
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown, busy])

  // はじまったら キー操作を受けつけるよう画面にフォーカスする
  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true })
  }, [])

  const run = (action: BattleAction, selection?: number) => {
    setMenu('main')
    setCursor(0)
    onCommand(action, selection)
  }

  const openMenu = (next: Menu) => {
    setMenu(next)
    setCursor(0)
  }

  const back = () => {
    if (menu === 'main') return
    setCursor(menu === 'spell' ? 1 : 3)
    setMenu('main')
  }

  const toItems = (options: CommandOption[], action: BattleAction): MenuItem[] => [
    ...options.map((o) => ({
      key: String(o.selection),
      label: o.label,
      detail: o.detail,
      disabled: o.disabled,
      title: o.reason,
      run: () => run(action, o.selection),
    })),
    { key: 'back', label: 'もどる', run: back },
  ]

  // いま出しているメニュー（メッセージ表示中は出さない）
  let menuTitle = 'コマンド'
  let menuItems: MenuItem[] = []
  if (auto && introDone) {
    // オート中は「とめる」だけ（メッセージの とちゅうでも とめられる）
    menuTitle = `オート ${auto.count}/${auto.total}`
    menuItems = [{ key: 'stop', label: 'とめる', run: onStopAuto }]
  } else if (!busy && introDone) {
    if (finished) {
      menuTitle = 'おわり'
      menuItems = [{ key: 'restart', label: 'もういちど たたかう', run: onRestart }]
    } else if (result.player_sleep) {
      menuItems = [{ key: 'next', label: 'つぎへ', run: () => run('attack') }]
    } else if (menu === 'main') {
      menuItems = [
        { key: 'attack', label: 'たたかう', run: () => run('attack') },
        { key: 'spell', label: 'じゅもん', run: () => openMenu('spell') },
        { key: 'escape', label: 'にげる', run: () => run('escape') },
        { key: 'item', label: 'どうぐ', run: () => openMenu('item') },
      ]
    } else {
      menuTitle = menu === 'spell' ? 'じゅもん' : 'どうぐ'
      menuItems = toItems(menu === 'spell' ? spells : items, menu)
    }
  }
  const isGrid = menuItems.length === 4 && menu === 'main' && !finished
  const current = Math.min(cursor, Math.max(menuItems.length - 1, 0))

  // メニューが出たら カーソルの項目にフォーカスを移す（画面を操作しているときだけ）
  const menuKey = `${menuTitle}:${menuItems.length}`
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !stage.contains(document.activeElement)) return
    itemRefs.current[current]?.focus({ preventScroll: true })
    // カーソル移動のたびではなく、メニューが変わったときだけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuKey])

  const moveTo = (index: number) => {
    setCursor(index)
    itemRefs.current[index]?.focus({ preventScroll: true })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const key = e.key
    if (busy || !introDone) {
      // メッセージ送り
      if (key === 'Enter' || key === ' ' || key === 'z' || key === 'Z') {
        e.preventDefault()
        onSkip()
      }
      return
    }
    if (menuItems.length === 0) return
    const n = menuItems.length
    let next: number | null = null
    if (isGrid) {
      if (key === 'ArrowLeft' || key === 'ArrowRight') next = current ^ 1
      if (key === 'ArrowUp' || key === 'ArrowDown') next = current ^ 2
    } else {
      if (key === 'ArrowUp') next = (current - 1 + n) % n
      if (key === 'ArrowDown') next = (current + 1) % n
    }
    if (next !== null) {
      e.preventDefault()
      moveTo(next)
    } else if (key === 'z' || key === 'Z') {
      e.preventDefault()
      const item = menuItems[current]
      if (!item.disabled) item.run()
    } else if (key === 'x' || key === 'X' || key === 'Escape' || key === 'Backspace') {
      e.preventDefault()
      back()
    } else if ((key === 'Enter' || key === ' ') && e.target === stageRef.current) {
      // ボタンにフォーカスが無いとき（はじまった直後など）
      e.preventDefault()
      const item = menuItems[current]
      if (!item.disabled) item.run()
    }
  }

  const monsterGone = result.monster_defeated || result.monster_escaped
  const hpLow = summary.hp <= st.max_hp / 4

  const menuWindow =
    menuItems.length > 0 ? (
      <RetroWindow
        title={menuTitle}
        box={auto || menu === 'main' || finished || result.player_sleep ? LAYOUT.command : LAYOUT.subMenu}
      >
        <div className={isGrid ? styles.menuGrid : styles.menuList} role="menu" aria-label={menuTitle}>
          {menuItems.map((item, i) => (
            <button
              key={item.key}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitem"
              className={styles.menuItem}
              data-cursor={i === current || undefined}
              aria-disabled={item.disabled || undefined}
              title={item.title}
              tabIndex={i === current ? 0 : -1}
              onMouseEnter={() => moveTo(i)}
              onFocus={() => setCursor(i)}
              onClick={() => {
                if (!item.disabled) item.run()
              }}
            >
              <span className={styles.menuLabel}>{item.label}</span>
              {item.detail && <span className={styles.menuDetail}>{item.detail}</span>}
            </button>
          ))}
        </div>
      </RetroWindow>
    ) : null

  return (
    <div className={styles.frame}>
      <MonsterHud result={result} label={monsterLabel} maxHp={monsterMaxHp} onQuit={onQuit} onOpenLog={onOpenLog} />

      <div className={styles.stageWrap}>
        <div
          ref={stageRef}
          className={styles.stage}
          style={{ background: backdropColor }}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          aria-label="せんとう画面"
          role="group"
        >
          <div className={styles.scene}>
            {background && (
              <PixelCanvas
                image={getBattleBackgroundImage(introDone ? undefined : blocks) ?? new ImageData(1, 1)}
                x={background.x}
                y={background.y}
              />
            )}

            {sprite && spriteImage && introDone && (
              <PixelCanvas
                image={spriteImage}
                x={sprite.x}
                y={sprite.y}
                className={[styles.monster, monsterGone ? styles.monsterGone : ''].filter(Boolean).join(' ')}
              />
            )}
            {/* 絵の代わりの読み上げ */}
            <span className={styles.visuallyHidden}>{monsterLabel}</span>

            <RetroWindow title={formatName(summary.name) || 'ゆうしゃ'} box={LAYOUT.status}>
              <dl className={styles.status}>
                <div>
                  <dt>レベル</dt>
                  <dd>{summary.level}</dd>
                </div>
                <div>
                  <dt>HP</dt>
                  <dd className={hpLow ? styles.danger : undefined}>{summary.hp}</dd>
                </div>
                <div>
                  <dt>MP</dt>
                  <dd>{summary.mp}</dd>
                </div>
                <div>
                  <dt>G</dt>
                  <dd>{summary.gold}</dd>
                </div>
                <div>
                  <dt>E</dt>
                  <dd>{summary.experience}</dd>
                </div>
              </dl>
            </RetroWindow>

            {introDone && (
              <RetroWindow box={LAYOUT.message}>
                {/* クリックで送り表示をとばす */}
                <div ref={logRef} className={styles.log} onClick={onSkip} aria-live="polite" aria-busy={busy}>
                  {revealLines(texts, shown).map((text, i) => (
                    <p key={i}>{text || ' '}</p>
                  ))}
                  {!busy && !finished && !auto && <p>コマンド？</p>}
                </div>
                {busy && <span className={styles.more}>▼</span>}
              </RetroWindow>
            )}

            {/* じゅもん・どうぐの一覧は メッセージの上に重ねる */}
            {menuWindow}
          </div>
        </div>
      </div>
    </div>
  )
}

/** 画面の上に小さく出す モンスターの HP と じょうたい */
function MonsterHud({
  result,
  label,
  maxHp,
  onQuit,
  onOpenLog,
}: {
  result: BattleTurnResult
  label: string
  maxHp: number
  onQuit: () => void
  onOpenLog: () => void
}) {
  const rate = maxHp > 0 ? result.monster_hp / maxHp : 0
  const chips = [
    result.monster_sleep && `${result.monster_name}：ねむり`,
    result.monster_seal && `${result.monster_name}：じゅもん ふうじ`,
    result.player_sleep && 'ゆうしゃ：ねむり',
    result.player_seal && 'ゆうしゃ：じゅもん ふうじ',
  ].filter((chip): chip is string => !!chip)

  return (
    <div className={styles.hud}>
      <span className={styles.hudName}>{label}</span>
      <div
        className={styles.hpBar}
        role="meter"
        aria-label={`${result.monster_name}の HP`}
        aria-valuemin={0}
        aria-valuemax={maxHp}
        aria-valuenow={result.monster_hp}
      >
        <span style={{ width: `${rate * 100}%` }} data-low={rate <= 0.25 || undefined} />
      </div>
      <span className={styles.hudHp}>
        {result.monster_hp}
        <small> / {maxHp}</small>
      </span>
      {chips.map((chip) => (
        <span key={chip} className={styles.chip}>
          {chip}
        </span>
      ))}
      <button type="button" data-variant="ghost" className={styles.hudButtonFirst} onClick={onOpenLog}>
        <ScrollText size={12} />
        ログ
      </button>
      <button type="button" data-variant="ghost" className={styles.hudButton} onClick={onQuit}>
        <X size={12} />
        やめる
      </button>
    </div>
  )
}
