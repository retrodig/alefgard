import { DataTable, type Column } from '../../components/DataTable'
import { Window } from '../../components/Window'
import type { SpellData } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'

const COLUMNS: Column<SpellData>[] = [
  { key: 'name', label: 'なまえ', value: (s) => s.name },
  { key: 'learn_level', label: 'おぼえるLv', value: (s) => s.learn_level, numeric: true },
  { key: 'mp_cost', label: 'しょうひMP', value: (s) => s.mp_cost, numeric: true },
  { key: 'description', label: 'こうか', value: (s) => s.description, sortable: false, wrap: true },
]

export function SpellsPage() {
  const { spells } = useDamdara().getMasterData()
  return (
    <Window title="じゅもん" flush>
      <DataTable caption="じゅもん一覧" rows={spells} columns={COLUMNS} rowKey={(s) => s.id} />
    </Window>
  )
}
