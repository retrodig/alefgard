import { useEffect, useRef, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { MonsterSprite } from '../../components/MonsterSprite'
import { Window } from '../../components/Window'
import { formatName } from '../../features/jumon/kana'
import type { BattleTurnResult } from '../../wasm/types'
import styles from './Battle.module.css'

export interface LogLine {
  turn: number
  text: string
}

interface Props {
  result: BattleTurnResult
  /** 形態つきの表示名 */
  monsterLabel: string
  monsterMaxHp: number
  log: LogLine[]
  /** 表示済みの行数（1 行ずつ送り表示する） */
  shown: number
  onSkip: () => void
  commands: ReactNode
  /** おなじ条件で もういちど たたかう */
  onRestart: () => void
}

function Badge({ children }: { children: ReactNode }) {
  return <span className={styles.badge}>{children}</span>
}

function outcomeText(result: BattleTurnResult): string | null {
  if (!result.is_finished) return null
  if (result.monster_defeated) return `${result.monster_name}を たおした！`
  if (!result.player_survived) return 'しんでしまった…'
  if (result.player_escaped) return 'うまく にげきれた'
  if (result.monster_escaped) return `${result.monster_name}は にげだした`
  return 'たたかいが おわった'
}

/** せんとう画面：ステータス・モンスター・メッセージ・コマンド */
export function BattleScreen({ result, monsterLabel, monsterMaxHp, log, shown, onSkip, commands, onRestart }: Props) {
  const { summary, strength_status: st } = result.player_state
  const logRef = useRef<HTMLDivElement>(null)
  const busy = shown < log.length
  const outcome = busy ? null : outcomeText(result)
  const hpRate = monsterMaxHp > 0 ? result.monster_hp / monsterMaxHp : 0

  // 新しいメッセージが出たら一番下までスクロールする
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  return (
    <div className={styles.screen}>
      <div className={styles.statusRow}>
        <Window title={formatName(summary.name) || 'ゆうしゃ'}>
          <dl className={styles.stats}>
            <div>
              <dt>Lv</dt>
              <dd>{summary.level}</dd>
            </div>
            <div>
              <dt>HP</dt>
              <dd className={summary.hp <= st.max_hp / 4 ? styles.danger : undefined}>
                {summary.hp}
                <small> / {st.max_hp}</small>
              </dd>
            </div>
            <div>
              <dt>MP</dt>
              <dd>
                {summary.mp}
                <small> / {st.max_mp}</small>
              </dd>
            </div>
          </dl>
          <div className={styles.badges}>
            {result.player_sleep && <Badge>ねむり</Badge>}
            {result.player_seal && <Badge>じゅもん ふうじ</Badge>}
          </div>
        </Window>

        <Window title={monsterLabel}>
          <div className={styles.monsterStage} data-defeated={result.monster_defeated || undefined}>
            <MonsterSprite monsterId={result.monster_id} label={monsterLabel} mode="stage" />
          </div>
          <div className={styles.monsterHp}>
            <span>HP</span>
            <span className={styles.monsterHpValue}>
              {result.monster_hp}
              <small> / {monsterMaxHp}</small>
            </span>
          </div>
          <div
            className={styles.hpBar}
            role="meter"
            aria-label={`${result.monster_name}の HP`}
            aria-valuemin={0}
            aria-valuemax={monsterMaxHp}
            aria-valuenow={result.monster_hp}
          >
            <span style={{ width: `${hpRate * 100}%` }} data-low={hpRate <= 0.25 || undefined} />
          </div>
          <div className={styles.badges}>
            {result.monster_sleep && <Badge>ねむり</Badge>}
            {result.monster_seal && <Badge>じゅもん ふうじ</Badge>}
          </div>
        </Window>
      </div>

      <Window title="メッセージ">
        {/* クリックで送り表示をとばす */}
        <div ref={logRef} className={styles.log} onClick={onSkip} aria-live="polite">
          {log.slice(0, shown).map((line, i) => {
            const newTurn = i > 0 && log[i - 1].turn !== line.turn
            return (
              <p key={i} className={newTurn ? styles.turnStart : undefined}>
                {line.text || ' '}
              </p>
            )
          })}
          {busy && <span className={styles.more}>▼</span>}
        </div>
      </Window>

      <Window title={outcome ? 'けっか' : 'コマンド'}>
        {outcome ? (
          <div className={styles.outcomeBox}>
            <p className={styles.outcome}>{outcome}</p>
            <button type="button" data-variant="primary" onClick={onRestart}>
              <RotateCcw size={15} />
              もういちど たたかう
            </button>
          </div>
        ) : (
          commands
        )}
      </Window>
    </div>
  )
}
