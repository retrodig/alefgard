import { useMemo } from 'react'
import { DataTable, type Column } from '../../components/DataTable'
import { Window } from '../../components/Window'
import type { StatusData } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import styles from './Data.module.css'

interface LevelRow extends StatusData {
  /** 前のレベルからの必要経験値 */
  diff_exp: number
}

const COLUMNS: Column<LevelRow>[] = [
  { key: 'level', label: 'Lv', value: (r) => r.level, numeric: true },
  { key: 'required_exp', label: 'けいけんち', value: (r) => r.required_exp, numeric: true, sortable: false },
  { key: 'diff_exp', label: 'まえのLvから', value: (r) => r.diff_exp, numeric: true, sortable: false },
  { key: 'strength', label: 'ちから', value: (r) => r.strength, numeric: true, sortable: false },
  { key: 'agility', label: 'すばやさ', value: (r) => r.agility, numeric: true, sortable: false },
  { key: 'max_hp', label: 'さいだいHP', value: (r) => r.max_hp, numeric: true, sortable: false },
  { key: 'max_mp', label: 'さいだいMP', value: (r) => r.max_mp, numeric: true, sortable: false },
  {
    key: 'spell',
    label: 'おぼえるじゅもん',
    value: (r) => r.spell ?? '',
    render: (r) => r.spell ?? '',
    sortable: false,
  },
]

export function LevelsPage() {
  const { statusTable } = useDamdara().getMasterData()
  const rows = useMemo(
    () =>
      statusTable.map((s, i) => ({
        ...s,
        diff_exp: i === 0 ? 0 : s.required_exp - statusTable[i - 1].required_exp,
      })),
    [statusTable],
  )

  return (
    <>
      <Window title="レベル" flush>
        <DataTable
          caption="レベルべつ ステータス"
          rows={rows}
          columns={COLUMNS}
          rowKey={(r) => r.level}
          defaultSort={{ key: 'level', dir: 'asc' }}
        />
      </Window>
      <p className={styles.note}>
        ちから・すばやさ・さいだいHP・さいだいMP は基準値です。実際の値はなまえによって補正されます。
      </p>
    </>
  )
}
