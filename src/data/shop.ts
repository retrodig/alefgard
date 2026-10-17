// 価格の表示補正（一般的な攻略情報）

/** damdara のデータ上は価格があるが、店では買えない装備 */
export const NOT_FOR_SALE: ReadonlySet<string> = new Set(['ロトのつるぎ', 'ロトのよろい'])

export function formatPrice(name: string, price: number): string {
  if (price === 0 || NOT_FOR_SALE.has(name)) return '－'
  return `${price.toLocaleString('ja-JP')}G`
}
