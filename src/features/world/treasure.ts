// たからばこ・しらべると みつかる もの の 中身を 文章にする。

import type { TreasureData, TreasureEmptyIf } from '../../wasm/types'

/** アイテム・ぶき・よろい の なまえ（damdara の 添字 → なまえ） */
export interface TreasureNames {
  item: (id: number) => string
  weapon: (id: number) => string
  armor: (id: number) => string
  dialogue: (id: number) => string | undefined
}

function goldRange(min: number, max: number): string {
  return min === max ? `${min}ゴールド` : `${min}〜${max}ゴールド`
}

/** からっぽに なる じょうけん（かくし かいだん は いちど みつけると ひらいた まま なので そえない） */
function emptyNote(emptyIf: TreasureEmptyIf, names: TreasureNames): string | null {
  switch (emptyIf.type) {
    case 'herbs_full':
      return 'やくそうを もちきれない ときは からっぽ'
    case 'keys_full':
      return 'かぎを もちきれない ときは からっぽ'
    case 'has_item':
      return `${names.item(emptyIf.item)}を もっている ときは からっぽ`
    case 'has_any_item':
      return `${emptyIf.items.map(names.item).join('・')} の どれかを もっている ときは からっぽ`
    case 'weapon_equipped':
      return `${names.weapon(emptyIf.weapon)}を そうびしている ときは からっぽ`
    case 'armor_equipped':
      return `${names.armor(emptyIf.armor)}を そうびしている ときは からっぽ`
    case 'hidden_stairs_found':
      return null
  }
}

/** ウィンドウの タイトルと 行（ページは 1 つ） */
export function treasureInfo(treasure: TreasureData, names: TreasureNames): { title: string; lines: string[] } {
  const chest = treasure.kind === 'chest'
  const found = (what: string) => (chest ? `${what}が はいっている。` : `しらべると ${what}が みつかる。`)
  const { content } = treasure
  const lines: string[] = []
  switch (content.type) {
    case 'gold':
      lines.push(found(goldRange(content.min, content.max)))
      break
    case 'item_or_gold':
      lines.push(found(treasure.name ?? names.item(content.item)))
      lines.push(`（1/${content.one_in} の かくりつ。でなければ ${goldRange(content.gold_min, content.gold_max)}）`)
      break
    case 'hint':
      lines.push(...(names.dialogue(content.dialogue_id) ?? '').split(/[\n▼]/).filter(Boolean))
      break
    case 'decoration':
      lines.push('なにも はいっていない。（かざりの たからばこ）')
      break
    case 'hidden_stairs':
      lines.push(found('かくし かいだん'))
      break
    default:
      lines.push(found(treasure.name ?? '？'))
  }
  const note = treasure.empty_if ? emptyNote(treasure.empty_if, names) : null
  if (note) lines.push(`（${note}）`)
  return { title: chest ? 'たからばこ' : 'しらべる', lines }
}
