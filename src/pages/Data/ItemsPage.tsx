import { DataTable, type Column } from '../../components/DataTable'
import { Window } from '../../components/Window'
import { formatPrice } from '../../data/shop'
import type { EquipmentData } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import styles from './Data.module.css'

function effect(item: EquipmentData): string {
  const parts = []
  if (item.attack) parts.push(`こうげき力 +${item.attack}`)
  if (item.defense) parts.push(`しゅび力 +${item.defense}`)
  return parts.join(' ') || '－'
}

const COLUMNS: Column<EquipmentData>[] = [
  { key: 'name', label: 'なまえ', value: (i) => i.name },
  { key: 'effect', label: 'そうびこうか', value: effect, sortable: false },
  { key: 'price', label: 'かいね', value: (i) => i.price, render: (i) => formatPrice(i.name, i.price), numeric: true },
  { key: 'sell', label: 'うりね', value: (i) => i.sell, render: (i) => formatPrice(i.name, i.sell), numeric: true },
]

export function ItemsPage() {
  const { items } = useDamdara().getMasterData()
  return (
    <>
      <Window title="どうぐ">
        <DataTable
          caption="どうぐ一覧"
          rows={items.filter((i) => i.name !== 'なし')}
          columns={COLUMNS}
          rowKey={(i) => i.id}
          searchText={(i) => i.name}
        />
      </Window>
      <p className={styles.note}>「－」は店で買えない・売れないもの。</p>
    </>
  )
}
