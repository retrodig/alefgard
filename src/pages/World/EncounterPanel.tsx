import { Swords } from 'lucide-react'
import { MonsterSprite } from '../../components/MonsterSprite'
import { summarizeEncounter } from '../../features/world/encounter'
import type { EncounterData } from '../../wasm/types'
import styles from './World.module.css'

interface Props {
  /** えらんだ ばしょ（または ダンジョン全体）の まもの。なければ あんないを出す */
  encounter: EncounterData | null
  /** encounter が ない ときの あんない */
  placeholder: string
  /** このマップで かならず まものが でる ばしょ */
  fixed: EncounterData[]
  onBattle: (monsterId: number) => void
}

function MonsterRow({ id, name, note, onBattle }: { id: number; name: string; note: string; onBattle: () => void }) {
  return (
    <li className={styles.monster}>
      <MonsterSprite monsterId={id} label={name} size={28} />
      <span className={styles.monsterName}>{name}</span>
      <span className={styles.monsterNote}>{note}</span>
      <button type="button" data-variant="ghost" aria-label={`${name}と たたかう`} title="たたかう" onClick={onBattle}>
        <Swords size={14} />
      </button>
    </li>
  )
}

/** でてくる まもの：5 ひきの うちわけ・せんとうの かくりつ・かならず でる まもの */
export function EncounterPanel({ encounter, placeholder, fixed, onBattle }: Props) {
  const monsters = encounter ? summarizeEncounter(encounter.monsters) : []
  return (
    <section className={styles.encounter} aria-label="でてくる まもの">
      <h3 className={styles.storyTitle}>でてくる まもの</h3>
      {encounter && monsters.length > 0 ? (
        <>
          {encounter.one_in && (
            <p className={styles.encounterRate}>1ぽ あるくごとに 1/{encounter.one_in} で せんとう</p>
          )}
          <ul className={styles.monsters}>
            {monsters.map((m) => (
              <MonsterRow key={m.id} id={m.id} name={m.name} note={`${m.count}/5`} onBattle={() => onBattle(m.id)} />
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.storyNote}>{encounter ? 'ここでは まものは でてこない。' : placeholder}</p>
      )}
      {fixed.length > 0 && (
        <>
          <h4 className={styles.encounterSub}>かならず でる まもの</h4>
          <ul className={styles.monsters}>
            {fixed.map(
              (f) =>
                f.fixed && (
                  <MonsterRow
                    key={`${f.x},${f.y}`}
                    id={f.fixed.monster.id}
                    name={f.fixed.monster.name}
                    note={f.fixed.once ? 'いちどだけ' : 'なんどでも'}
                    onBattle={() => onBattle(f.fixed!.monster.id)}
                  />
                ),
            )}
          </ul>
        </>
      )}
    </section>
  )
}
