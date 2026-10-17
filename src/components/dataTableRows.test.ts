import { describe, expect, it } from 'vitest'
import { selectRows, type ColumnValue } from './dataTableRows'

interface Row {
  name: string
  hp: number
}

const rows: Row[] = [
  { name: 'スライム', hp: 3 },
  { name: 'ドラキー', hp: 6 },
  { name: 'スライムベス', hp: 4 },
]
const columns: ColumnValue<Row>[] = [
  { key: 'name', value: (r) => r.name },
  { key: 'hp', value: (r) => r.hp },
]
const names = (list: Row[]) => list.map((r) => r.name)

describe('selectRows', () => {
  it('並べ替えなしでは元の順', () => {
    expect(names(selectRows(rows, columns, null, ''))).toEqual(['スライム', 'ドラキー', 'スライムベス'])
  })

  it('数値列を昇順・降順に並べる', () => {
    expect(names(selectRows(rows, columns, { key: 'hp', dir: 'asc' }, ''))).toEqual(['スライム', 'スライムベス', 'ドラキー'])
    expect(names(selectRows(rows, columns, { key: 'hp', dir: 'desc' }, ''))).toEqual(['ドラキー', 'スライムベス', 'スライム'])
  })

  it('ひらがなでもカタカナの名前を絞り込める', () => {
    expect(names(selectRows(rows, columns, null, 'すらいむ', (r) => r.name))).toEqual(['スライム', 'スライムベス'])
  })
})
