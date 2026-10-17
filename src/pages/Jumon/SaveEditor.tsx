import { useId, useState, type ReactNode } from 'react'
import { RotateCcw, Zap } from 'lucide-react'
import { Window } from '../../components/Window'
import { formatName, NAME_MAX_LENGTH, normalizeName } from '../../features/jumon/kana'
import { DEFAULT_SAVE, LIMITS, padName, type SaveData, type SaveFlags } from '../../features/jumon/password'
import type { MasterData } from '../../wasm/init'
import styles from './Jumon.module.css'

interface Props {
  save: SaveData
  /** damdara が けいけんち から求めたレベル */
  level: number
  master: MasterData
  onChange: (save: SaveData) => void
}

const FLAG_LABELS: [keyof SaveFlags, string][] = [
  ['hasDragonScale', 'りゅうのうろこを そうびした'],
  ['hasWarriorRing', 'せんしのゆびわを そうびした'],
  ['hasCursedNecklace', 'しのくびかざりを てにいれた'],
  ['defeatedGolem', 'ゴーレムを たおした'],
  ['defeatedDragon', 'ドラゴンを たおした'],
]

const range = (max: number) => Array.from({ length: max + 1 }, (_, i) => i)

/** 数値入力を 0〜max に収める（空欄は 0） */
const toNumber = (value: string, max: number) => Math.min(Math.max(Math.trunc(Number(value)) || 0, 0), max)

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      {children}
    </section>
  )
}

function NameField({ id, name, onChange }: { id: string; name: string; onChange: (name: string) => void }) {
  const [draft, setDraft] = useState(() => formatName(name))
  const [prevName, setPrevName] = useState(name)

  // じゅもん側の変更でなまえが変わったら入力欄も追従させる
  if (name !== prevName) {
    setPrevName(name)
    if (padName(normalizeName(draft).value) !== name) setDraft(formatName(name))
  }

  const normalized = normalizeName(draft)
  const handleChange = (value: string) => {
    setDraft(value)
    const next = normalizeName(value)
    if (next.valid) onChange(padName(next.value))
  }

  return (
    <Field id={id} label="なまえ">
      <input
        id={id}
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        aria-invalid={!normalized.valid}
        autoComplete="off"
        spellCheck={false}
      />
      {!normalized.valid && (
        <p className={styles.fieldError}>
          {normalized.chars.length === 0
            ? 'なまえを いれてください'
            : normalized.chars.length > NAME_MAX_LENGTH
              ? `${normalized.chars.length} もじあります（濁音は 2 もじ分で ${NAME_MAX_LENGTH} もじまで）`
              : 'つかえない文字が ふくまれています'}
        </p>
      )}
    </Field>
  )
}

/** パラメータを編集する「ぼうけんのしょ」 */
export function SaveEditor({ save, level, master, onChange }: Props) {
  const ids = useId()
  const fieldId = (name: string) => `${ids}-${name}`
  const set = <K extends keyof SaveData>(key: K, value: SaveData[K]) => onChange({ ...save, [key]: value })

  const setLevel = (lv: number) => {
    const status = master.statusTable.find((s) => s.level === lv)
    if (status) set('experience', status.required_exp)
  }

  const setItem = (slot: number, id: number) => {
    const items = [...save.items]
    items[slot] = id
    set('items', items)
  }

  const maximize = () =>
    onChange({
      ...save,
      experience: LIMITS.experience,
      gold: LIMITS.gold,
      weapon: LIMITS.weapon,
      armor: LIMITS.armor,
      shield: LIMITS.shield,
      herbs: LIMITS.herbs,
      keys: LIMITS.keys,
    })

  const equipment = (key: 'weapon' | 'armor' | 'shield', label: string, options: { id: number; name: string }[]) => (
    <Field id={fieldId(key)} label={label}>
      <select id={fieldId(key)} value={save[key]} onChange={(e) => set(key, Number(e.target.value))}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </Field>
  )

  const countSelect = (key: 'herbs' | 'keys', label: string, max: number) => (
    <Field id={fieldId(key)} label={label}>
      <select id={fieldId(key)} value={save[key]} onChange={(e) => set(key, Number(e.target.value))}>
        {range(max).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </Field>
  )

  return (
    <Window
      title="ぼうけんのしょ"
      actions={
        <>
          <button type="button" data-variant="ghost" onClick={() => onChange({ ...DEFAULT_SAVE, name: save.name })}>
            <RotateCcw size={14} />
            リセット
          </button>
          <button type="button" data-variant="primary" onClick={maximize}>
            <Zap size={14} />
            さいきょう
          </button>
        </>
      }
    >
      <div className={styles.editor}>
        <Section>
          <div className={styles.grid4}>
            <NameField id={fieldId('name')} name={save.name} onChange={(name) => set('name', name)} />
            <Field id={fieldId('level')} label="レベル">
              <select id={fieldId('level')} value={level} onChange={(e) => setLevel(Number(e.target.value))}>
                {master.statusTable.map((s) => (
                  <option key={s.level} value={s.level}>
                    {s.level}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={fieldId('exp')} label="けいけんち">
              <input
                id={fieldId('exp')}
                type="number"
                inputMode="numeric"
                min={0}
                max={LIMITS.experience}
                value={save.experience}
                onChange={(e) => set('experience', toNumber(e.target.value, LIMITS.experience))}
              />
            </Field>
            <Field id={fieldId('gold')} label="ゴールド">
              <input
                id={fieldId('gold')}
                type="number"
                inputMode="numeric"
                min={0}
                max={LIMITS.gold}
                value={save.gold}
                onChange={(e) => set('gold', toNumber(e.target.value, LIMITS.gold))}
              />
            </Field>
          </div>
        </Section>

        <Section title="そうび">
          <div className={styles.grid3}>
            {equipment('weapon', 'ぶき', master.weapons)}
            {equipment('armor', 'よろい', master.armors)}
            {equipment('shield', 'たて', master.shields)}
          </div>
        </Section>

        <Section title="どうぐ">
          <div className={styles.grid4}>
            {save.items.map((id, slot) => (
              <select
                key={slot}
                aria-label={`どうぐ ${slot + 1}`}
                value={id}
                onChange={(e) => setItem(slot, Number(e.target.value))}
              >
                {master.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <div className={styles.grid4}>
            {countSelect('herbs', 'やくそう', LIMITS.herbs)}
            {countSelect('keys', 'かぎ', LIMITS.keys)}
          </div>
        </Section>

        <Section title="フラグ">
          <div className={styles.flags}>
            {FLAG_LABELS.map(([key, label]) => (
              <label key={key} className={styles.switch}>
                <input
                  type="checkbox"
                  checked={save.flags[key]}
                  onChange={(e) => set('flags', { ...save.flags, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </Section>

        <Section title="パターン">
          <div className={styles.patternRow}>
            <select
              id={fieldId('pattern')}
              aria-label="パターン"
              value={save.pattern}
              onChange={(e) => set('pattern', Number(e.target.value))}
            >
              {range(LIMITS.pattern).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className={styles.hint}>おなじ ないようでも べつの じゅもんに なります</p>
          </div>
        </Section>
      </div>
    </Window>
  )
}
