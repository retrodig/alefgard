import { DataTable, type Column } from '../../components/DataTable'
import { Window } from '../../components/Window'
import { formatPrice } from '../../data/shop'
import type { EquipmentData } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import styles from './Data.module.css'

const NONE = 'なし'

const priceColumns: Column<EquipmentData>[] = [
  {
    key: 'price',
    label: 'かいね',
    value: (e) => e.price,
    render: (e) => formatPrice(e.name, e.price),
    numeric: true,
  },
  {
    key: 'sell',
    label: 'うりね',
    value: (e) => e.sell,
    render: (e) => formatPrice(e.name, e.sell),
    numeric: true,
  },
]

const nameColumn: Column<EquipmentData> = { key: 'name', label: 'なまえ', value: (e) => e.name }

const WEAPON_COLUMNS: Column<EquipmentData>[] = [
  nameColumn,
  { key: 'attack', label: 'こうげき力', value: (e) => e.attack, numeric: true },
  ...priceColumns,
]

const DEFENSE_COLUMNS: Column<EquipmentData>[] = [
  nameColumn,
  { key: 'defense', label: 'しゅび力', value: (e) => e.defense, numeric: true },
  ...priceColumns,
]

const withoutNone = (list: EquipmentData[]) => list.filter((e) => e.name !== NONE)

export function EquipmentPage() {
  const { weapons, armors, shields } = useDamdara().getMasterData()
  return (
    <>
      <div className={styles.columns3}>
        <Window title="ぶき" flush>
          <DataTable
            caption="ぶき一覧"
            rows={withoutNone(weapons)}
            columns={WEAPON_COLUMNS}
            rowKey={(e) => e.id}
            compact
            sortable={false}
          />
        </Window>
        <Window title="よろい" flush>
          <DataTable
            caption="よろい一覧"
            rows={withoutNone(armors)}
            columns={DEFENSE_COLUMNS}
            rowKey={(e) => e.id}
            compact
            sortable={false}
          />
        </Window>
        <Window title="たて" flush>
          <DataTable
            caption="たて一覧"
            rows={withoutNone(shields)}
            columns={DEFENSE_COLUMNS}
            rowKey={(e) => e.id}
            compact
            sortable={false}
          />
        </Window>
      </div>
      <p className={styles.note}>「－」は店で買えない・売れないもの。</p>
    </>
  )
}
