import { CharacterSprite } from '../../components/CharacterSprite'
import { Window } from '../../components/Window'
import { heroCharacterId } from '../../wasm/world'
import { formatName } from '../../features/jumon/kana'
import type { PlayerState, StatusData } from '../../wasm/types'
import styles from './Jumon.module.css'

interface Props {
  player: PlayerState
  statusTable: StatusData[]
}

const NONE = 'なし'

/** damdara が計算した つよさ（なまえによる補正込み） */
export function StatusPanel({ player, statusTable }: Props) {
  const { summary, strength_status: st } = player
  // ぶき・たて を もっているかで ゆうしゃの 絵が かわる
  const heroId = heroCharacterId(st.weapon !== NONE, st.shield !== NONE, false)
  const current = statusTable.find((s) => s.level === summary.level)
  const next = statusTable.find((s) => s.level === summary.level + 1)
  const base = current?.required_exp ?? 0
  const progress = next ? Math.min((summary.experience - base) / (next.required_exp - base), 1) : 1

  const tiles: [string, number][] = [
    ['さいだいHP', st.max_hp],
    ['さいだいMP', st.max_mp],
    ['ちから', st.strength],
    ['すばやさ', st.agility],
    ['こうげき力', st.attack_power],
    ['しゅび力', st.defense_power],
  ]

  return (
    <Window title={`${formatName(summary.name) || '（なまえなし）'}の つよさ`} className={styles.statusWindow}>
      {/* ひだりに ゆうしゃ、みぎに レベル と けいけんちの ゲージ */}
      <div className={styles.levelBlock}>
        <CharacterSprite characterId={heroId} label="ゆうしゃ" />
        <div className={styles.levelMain}>
          <div className={styles.levelRow}>
            <div>
              <span className={styles.levelLabel}>レベル</span>
              <span className={styles.levelValue}>{summary.level}</span>
            </div>
            <span className={styles.levelNext}>
              {next ? `つぎまで ${(next.required_exp - summary.experience).toLocaleString('ja-JP')}` : 'さいだいレベル'}
            </span>
          </div>
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="つぎのレベルまでの けいけんち"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      <dl className={styles.tiles}>
        {tiles.map(([label, value]) => (
          <div key={label} className={styles.tile}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.hint}>なまえによって ちから・すばやさ・HP・MP が かわります。</p>
    </Window>
  )
}
