import { useId, useState } from 'react'
import { ChevronRight, Repeat, Shuffle, Swords } from 'lucide-react'
import { SpriteViewer } from '../../components/SpriteViewer'
import { Window } from '../../components/Window'
import { monsterLabel } from '../../data/monsters'
import {
  AUTO_COUNT_MAX,
  clampAutoCount,
  loadOptionsOpen,
  storeOptionsOpen,
  type AutoBattleSetting,
} from '../../features/battle/storage'
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
  /** 勝ったら けいけんち・ゴールドを ゆうしゃに たす */
  gainRewards: boolean
  onGainRewardsChange: (gain: boolean) => void
  auto: AutoBattleSetting
  onAutoChange: (auto: AutoBattleSetting) => void
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
  gainRewards,
  onGainRewardsChange,
  auto,
  onAutoChange,
  inBattle,
  onStart,
}: Props) {
  const ids = useId()
  const monster = monsters.find((m) => m.id === monsterId)
  // ばしょ から下は オプション。とじているときは いまの せっていを 1 行で出す
  const [optionsOpen, setOptionsOpen] = useState(loadOptionsOpen)
  const toggleOptions = () => {
    setOptionsOpen(!optionsOpen)
    storeOptionsOpen(!optionsOpen)
  }
  const optionsSummary = [
    place === 'field' ? 'フィールド' : 'どうくつ・おしろ',
    gainRewards ? 'せいちょう あり' : 'せいちょう なし',
    auto.enabled ? `オート ${auto.count}かい${auto.resultOnly ? '（けっか のみ）' : ''}` : 'オート なし',
  ].join('・')

  // かいすうは 入力中の文字を そのまま持ち、確定したときに 1〜100 にそろえる
  const [countDraft, setCountDraft] = useState(String(auto.count))
  const commitCount = () => {
    const count = clampAutoCount(Number(countDraft))
    setCountDraft(String(count))
    if (count !== auto.count) onAutoChange({ ...auto, count })
  }

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

        <div className={styles.options}>
          <button
            type="button"
            className={styles.optionsToggle}
            aria-expanded={optionsOpen}
            aria-controls={`${ids}-options`}
            onClick={toggleOptions}
          >
            <ChevronRight size={15} className={styles.optionsIcon} />
            オプション
            {!optionsOpen && <span className={styles.optionsSummary}>{optionsSummary}</span>}
          </button>
          {optionsOpen && (
            <div id={`${ids}-options`} className={styles.optionsBody}>
              <div className={styles.field}>
                <label htmlFor={`${ids}-place`}>ばしょ</label>
                <select
                  id={`${ids}-place`}
                  value={place}
                  onChange={(e) => onPlaceChange(e.target.value as BattlePlace)}
                >
                  <option value="field">フィールド（はいけい あり）</option>
                  <option value="dungeon">どうくつ・おしろ（はいけい なし）</option>
                </select>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>せいちょう</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={gainRewards}
                    onChange={(e) => onGainRewardsChange(e.target.checked)}
                  />
                  かったら けいけんち・ゴールドを ゆうしゃに たす
                </label>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>オート</span>
                <div className={styles.autoRow}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={auto.enabled}
                      onChange={(e) => onAutoChange({ ...auto, enabled: e.target.checked })}
                    />
                    たたかう だけを くりかえす
                  </label>
                  <span className={styles.countInput}>
                    <input
                      id={`${ids}-count`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={AUTO_COUNT_MAX}
                      value={countDraft}
                      disabled={!auto.enabled}
                      aria-label="オートで たたかう かいすう"
                      onChange={(e) => setCountDraft(e.target.value)}
                      onBlur={commitCount}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitCount()
                      }}
                    />
                    かい
                  </span>
                </div>
                <label className={styles.switch} data-disabled={!auto.enabled || undefined}>
                  <input
                    type="checkbox"
                    checked={auto.resultOnly}
                    disabled={!auto.enabled}
                    onChange={(e) => onAutoChange({ ...auto, resultOnly: e.target.checked })}
                  />
                  けっか だけ だす（えんしゅつ なし）
                </label>
                <label className={styles.switch} data-disabled={!auto.enabled || undefined}>
                  <input
                    type="checkbox"
                    checked={auto.stopOnLoss}
                    disabled={!auto.enabled}
                    onChange={(e) => onAutoChange({ ...auto, stopOnLoss: e.target.checked })}
                  />
                  まけたら とめる
                </label>
              </div>
            </div>
          )}
        </div>

        <button type="button" data-variant="primary" className={styles.startButton} onClick={onStart}>
          {auto.enabled ? <Repeat size={16} /> : <Swords size={16} />}
          {auto.enabled
            ? `オートで ${auto.count}かい たたかう${auto.resultOnly ? '（けっか のみ）' : ''}`
            : inBattle
              ? 'はじめから たたかう'
              : 'たたかう'}
        </button>
      </div>
    </Window>
  )
}
