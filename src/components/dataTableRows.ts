import { katakanaToHiragana } from '../features/jumon/kana'

export interface ColumnValue<T> {
  key: string
  /** 並べ替えと既定の表示に使う値 */
  value: (row: T) => string | number
}

export type Sort = { key: string; dir: 'asc' | 'desc' } | null

const normalize = (s: string) => katakanaToHiragana(s.normalize('NFKC')).toLowerCase()

/** 名前で絞り込み（カタカナ・ひらがなを区別しない）、指定の列で並べ替える */
export function selectRows<T>(
  rows: T[],
  columns: ColumnValue<T>[],
  sort: Sort,
  query: string,
  searchText?: (row: T) => string,
): T[] {
  const q = normalize(query.trim())
  const filtered = q && searchText ? rows.filter((row) => normalize(searchText(row)).includes(q)) : rows
  const column = sort && columns.find((c) => c.key === sort.key)
  if (!sort || !column) return filtered
  const sign = sort.dir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    const va = column.value(a)
    const vb = column.value(b)
    const diff =
      typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'ja')
    return diff * sign
  })
}
