import { useMemo } from 'react'
import { DataTable, type Column } from '../../components/DataTable'
import { MonsterSprite } from '../../components/MonsterSprite'
import { Window } from '../../components/Window'
import { monsterLabel } from '../../data/monsters'
import type { MonsterData } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'

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
  return (
    <Window title="モンスター" flush>
      <DataTable
        caption="モンスター一覧"
        rows={rows}
        columns={COLUMNS}
        rowKey={(m) => m.id}
        searchText={(m) => m.label}
      />
    </Window>
  )
}
