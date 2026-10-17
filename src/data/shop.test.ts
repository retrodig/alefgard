import { describe, expect, it } from 'vitest'
import { formatPrice } from './shop'

describe('formatPrice', () => {
  it('価格を G 付きで表示する', () => {
    expect(formatPrice('みかがみのたて', 14800)).toBe('14,800G')
  })

  it('0 と非売品は「－」', () => {
    expect(formatPrice('にじのしずく', 0)).toBe('－')
    expect(formatPrice('ロトのつるぎ', 2)).toBe('－')
  })
})
