import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronsUpDown, ChevronUp, Search } from 'lucide-react'
import { selectRows, type ColumnValue, type Sort } from './dataTableRows'
import styles from './DataTable.module.css'

export interface Column<T> extends ColumnValue<T> {
  label: string
  render?: (row: T) => ReactNode
  numeric?: boolean
  sortable?: boolean
  /** 長い文章の列は折り返す */
  wrap?: boolean
}

interface Props<T> {
  caption: string
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  /** 指定すると名前で絞り込む入力欄を出す */
  searchText?: (row: T) => string
  /** 狭い場所に置くための詰めた表示 */
  compact?: boolean
  /** false にすると見出しクリックでの並べ替えをなくす */
  sortable?: boolean
  /** 最初の並び順。指定すると「並べ替えなし」に戻らず、昇順と降順の切り替えだけになる */
  defaultSort?: Sort
}

/** 見出しクリックで並べ替えできる表 */
export function DataTable<T>({
  caption,
  rows,
  columns,
  rowKey,
  searchText,
  compact = false,
  sortable: tableSortable = true,
  defaultSort,
}: Props<T>) {
  const [sort, setSort] = useState<Sort>(defaultSort ?? null)
  const [query, setQuery] = useState('')
  const searchId = useId()

  const visibleRows = useMemo(
    () => selectRows(rows, columns, sort, query, searchText),
    [rows, columns, sort, query, searchText],
  )

  // 昇順 → 降順 → 元の順 の順に切り替える
  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      if (defaultSort) return { key, dir: 'asc' }
      return null
    })
  }

  return (
    <div className={styles.container}>
      {searchText && (
        <div className={styles.search}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            aria-label="なまえで さがす"
            placeholder="なまえで さがす"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}
      <div className={styles.scroll}>
        <table className={compact ? `${styles.table} ${styles.compact}` : styles.table}>
          <caption className={styles.caption}>
            {caption}（{visibleRows.length} けん）
          </caption>
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = tableSortable && (col.sortable ?? true)
                const dir = sort?.key === col.key ? sort.dir : null
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={col.numeric ? styles.numeric : undefined}
                    aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}
                  >
                    {sortable ? (
                      <button type="button" className={styles.sortButton} onClick={() => toggleSort(col.key)}>
                        {col.label}
                        <span className={styles.sortMark} aria-hidden="true">
                          {dir === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : dir === 'desc' ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronsUpDown size={14} />
                          )}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={
                      [col.numeric ? styles.numeric : '', col.wrap ? styles.wrap : ''].join(' ').trim() || undefined
                    }
                  >
                    {col.render ? col.render(row) : col.value(row)}
                  </td>
                ))}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  みつかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
