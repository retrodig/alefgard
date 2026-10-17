import { useId } from 'react'
import { Shuffle, Swords } from 'lucide-react'
import { SpriteViewer } from '../../components/SpriteViewer'
import { Window } from '../../components/Window'
import { monsterLabel } from '../../data/monsters'
import type { MonsterData } from '../../wasm/types'
import type { BattlePlace } from './BattleScreen'
import styles from './Battle.module.css'

export interface PlayerSource {
  id: string
  label: string
  password: string
}

interface Props {
  sources: PlayerSource[]
  sourceId: string
  onSourceChange: (id: string) => void
  /** えらんだゆうしゃの概要（なまえ・Lv など） */
  playerSummary: string
  monsters: MonsterData[]
  monsterId: number
  onMonsterChange: (id: number) => void
  place: BattlePlace
  onPlaceChange: (place: BattlePlace) => void
  inBattle: boolean
  onStart: () => void
}

/** せんとうの じゅんび：ゆうしゃ と モンスター をえらぶ */
export function BattleSetup({
  sources,
  sourceId,
  onSourceChange,
  playerSummary,
  monsters,
  monsterId,
  onMonsterChange,
  place,
  onPlaceChange,
  inBattle,
  onStart,
}: Props) {
  const ids = useId()
  const monster = monsters.find((m) => m.id === monsterId)

  return (
    <Window title="じゅんび">
      <div className={styles.setup}>
        <div className={styles.field}>
          <label htmlFor={`${ids}-player`}>ゆうしゃ</label>
          <select id={`${ids}-player`} value={sourceId} onChange={(e) => onSourceChange(e.target.value)}>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className={styles.hint}>{playerSummary}</p>
        </div>

        <div className={styles.field}>
          <label htmlFor={`${ids}-monster`}>モンスター</label>
          <div className={styles.inline}>
            <select id={`${ids}-monster`} value={monsterId} onChange={(e) => onMonsterChange(Number(e.target.value))}>
              {monsters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id + 1}. {monsterLabel(m, monsters)}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="ランダムに えらぶ"
              title="ランダムに えらぶ"
              onClick={() => onMonsterChange(monsters[Math.floor(Math.random() * monsters.length)].id)}
            >
              <Shuffle size={15} />
            </button>
          </div>
          {monster && (
            <div className={styles.monsterPreview}>
              {/* ゲーム画面と同じ位置・大きさの比率で描く。モンスターを変えたら拡大を戻す */}
              <SpriteViewer key={monster.id} monsterId={monster.id} label={monster.name} />
              <dl className={styles.monsterStats}>
                {(
                  [
                    ['HP', monster.hp],
                    ['こうげき', monster.attack],
                    ['しゅび', monster.defense],
                    ['けいけん', monster.exp],
                    ['ゴールド', monster.gold],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${ids}-place`}>ばしょ</label>
          <select id={`${ids}-place`} value={place} onChange={(e) => onPlaceChange(e.target.value as BattlePlace)}>
            <option value="field">フィールド（はいけい あり）</option>
            <option value="dungeon">どうくつ・おしろ（はいけい なし）</option>
          </select>
        </div>

        <button type="button" data-variant="primary" className={styles.startButton} onClick={onStart}>
          <Swords size={16} />
          {inBattle ? 'はじめから たたかう' : 'たたかう'}
        </button>
      </div>
    </Window>
  )
}
