import { useMemo, useState } from 'react'
import { DataTable, type Column } from '../../components/DataTable'
import { MonsterSprite } from '../../components/MonsterSprite'
import { Window } from '../../components/Window'
import { monsterLabel } from '../../data/monsters'
import type { MonsterData } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import { MonsterDialog } from './MonsterDialog'

interface MonsterRow extends MonsterData {
  /** 形態つきの表示名 */
  label: string
}

const COLUMNS: Column<MonsterRow>[] = [
  { key: 'id', label: 'No.', value: (m) => m.id + 1, numeric: true },
  {
    key: 'sprite',
    label: 'すがた',
    value: () => '',
    render: (m) => <MonsterSprite monsterId={m.id} label={m.label} size={40} />,
    sortable: false,
  },
  { key: 'name', label: 'なまえ', value: (m) => m.label },
  { key: 'hp', label: 'HP', value: (m) => m.hp, numeric: true },
  { key: 'attack', label: 'こうげき', value: (m) => m.attack, numeric: true },
  { key: 'defense', label: 'しゅび', value: (m) => m.defense, numeric: true },
  { key: 'exp', label: 'けいけんち', value: (m) => m.exp, numeric: true },
  { key: 'gold', label: 'ゴールド', value: (m) => m.gold, numeric: true },
]

export function MonstersPage() {
  const { monsters } = useDamdara().getMasterData()
  const rows = useMemo(() => monsters.map((m) => ({ ...m, label: monsterLabel(m, monsters) })), [monsters])
  /** くわしい 画面で 見ている モンスター（一覧の 番号） */
  const [selected, setSelected] = useState<number | null>(null)
  const current = selected === null ? null : rows[selected]

  return (
    <>
      <Window title="モンスター" flush>
        <DataTable
          caption="モンスター一覧"
          rows={rows}
          columns={COLUMNS}
          rowKey={(m) => m.id}
          searchText={(m) => m.label}
          onRowClick={(m) => setSelected(rows.indexOf(m))}
          rowLabel={(m) => `${m.label}の くわしい じょうほう`}
        />
      </Window>
      {/* ウィンドウの 中に おくと 余白の 指定が かかるので そとに */}
      {current && selected !== null && (
        <MonsterDialog
          monster={current}
          label={current.label}
          onPrev={selected > 0 ? () => setSelected(selected - 1) : undefined}
          onNext={selected < rows.length - 1 ? () => setSelected(selected + 1) : undefined}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
