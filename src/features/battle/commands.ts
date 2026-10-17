// せんとうの「じゅもん」「どうぐ」メニュー。
// damdara は選択番号（1 始まり）でじゅもん・どうぐを受け取るため、damdara と同じ順番で一覧を作る。
// 戦闘で使えないもの・MP が足りないものを選ぶと damdara は自動で「たたかう」になるので、選べないようにする。

import type { EquipmentData, SpellData } from '../../wasm/types'

export interface CommandOption {
  /** damdara に渡す選択番号（1 始まり） */
  selection: number
  label: string
  /** 補足（MP やこすう） */
  detail?: string
  disabled: boolean
  /** 選べない理由 */
  reason?: string
}

/** 戦闘中に効果のある じゅもん */
const BATTLE_SPELLS: ReadonlySet<string> = new Set(['ホイミ', 'ギラ', 'ラリホー', 'マホトーン', 'ベホイミ', 'ベギラマ'])

/** 戦闘中に使える どうぐ（ITEM_MASTER の id）：りゅうのうろこ・ようせいのふえ・せんしのゆびわ・のろいのベルト・ぎんのたてごと・しのくびかざり */
const BATTLE_ITEM_IDS: ReadonlySet<number> = new Set([4, 5, 6, 9, 10, 11])

const NONE = 'なし'

/** レベルで覚えている じゅもん（damdara の spell_list と同じ順） */
export function spellOptions(level: number, mp: number, spells: SpellData[]): CommandOption[] {
  return spells
    .filter((s) => s.learn_level <= level)
    .map((s, i) => {
      const usable = BATTLE_SPELLS.has(s.name)
      const enoughMp = mp >= s.mp_cost
      return {
        selection: i + 1,
        label: s.name,
        detail: `MP ${s.mp_cost}`,
        disabled: !usable || !enoughMp,
        reason: !usable ? 'つかえない' : !enoughMp ? 'MP ぶそく' : undefined,
      }
    })
}

/** もちもの（damdara の unified_item_list と同じ順：やくそう → かぎ → どうぐ 8 枠） */
export function itemOptions(herbs: number, keys: number, items: string[], itemMaster: EquipmentData[]): CommandOption[] {
  const options: Omit<CommandOption, 'selection'>[] = []
  if (herbs > 0) options.push({ label: 'やくそう', detail: `${herbs}こ`, disabled: false })
  if (keys > 0) options.push({ label: 'かぎ', detail: `${keys}こ`, disabled: true, reason: 'つかえない' })
  for (const name of items) {
    if (name === NONE) continue
    const id = itemMaster.find((item) => item.name === name)?.id ?? -1
    const usable = BATTLE_ITEM_IDS.has(id)
    options.push({ label: name, disabled: !usable, reason: usable ? undefined : 'つかえない' })
  }
  return options.map((option, i) => ({ ...option, selection: i + 1 }))
}
