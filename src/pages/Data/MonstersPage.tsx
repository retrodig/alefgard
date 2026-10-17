import { DataTable, type Column } from '../../components/DataTable'
import { Window } from '../../components/Window'
import type { MonsterData } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'

const COLUMNS: Column<MonsterData>[] = [
  { key: 'id', label: 'No.', value: (m) => m.id + 1, numeric: true },
  { key: 'name', label: 'なまえ', value: (m) => m.name },
  { key: 'hp', label: 'HP', value: (m) => m.hp, numeric: true },
  { key: 'attack', label: 'こうげき', value: (m) => m.attack, numeric: true },
  { key: 'defense', label: 'しゅび', value: (m) => m.defense, numeric: true },
  { key: 'exp', label: 'けいけんち', value: (m) => m.exp, numeric: true },
  { key: 'gold', label: 'ゴールド', value: (m) => m.gold, numeric: true },
]

export function MonstersPage() {
  const { monsters } = useDamdara().getMasterData()
  return (
    <Window title="モンスター">
      <DataTable caption="モンスター一覧" rows={monsters} columns={COLUMNS} rowKey={(m) => m.id} searchText={(m) => m.name} />
    </Window>
  )
}
