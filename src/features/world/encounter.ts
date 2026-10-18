// でてくる まもの（5 ひき・それぞれ 1/5）を まとめる。

export interface EncounterMonster {
  id: number
  name: string
  /** 5 ひきの うち なんびきか（でる かくりつは count / 5） */
  count: number
}

/** おなじ まものを まとめ、でやすい じゅんに ならべる（おなじなら さいしょに でてきた じゅん） */
export function summarizeEncounter(monsters: { id: number; name: string }[]): EncounterMonster[] {
  const counts = new Map<number, EncounterMonster>()
  for (const m of monsters) {
    const entry = counts.get(m.id)
    if (entry) entry.count++
    else counts.set(m.id, { id: m.id, name: m.name, count: 1 })
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)
}

export interface Habitat {
  mapId: number
  mapName: string
  /** フィールドで でてくる くかくの かず（ダンジョンでは null） */
  zones: number | null
  /** フィールドの くかくの ぜんぶの かず */
  totalZones: number | null
  /** そこの 5 ひきの うち いちばん おおい ときの かず */
  count: number
  /** かならず でる ばしょが ある（ゴーレム など） */
  fixed: boolean
}

interface HabitatMap {
  id: number
  name: string
  encounter_group?: number | null
  encounter_zones?: number[][] | null
}

/** その モンスターが でてくる マップ（フィールドは くかくの かず、かならず でる ばしょ も ふくむ） */
export function habitatsOf(
  monsterId: number,
  maps: HabitatMap[],
  groups: number[][],
  fixedMapIds: number[],
): Habitat[] {
  const countIn = (group: number) => (groups[group] ?? []).filter((id) => id === monsterId).length
  const habitats: Habitat[] = []
  for (const map of maps) {
    const fixed = fixedMapIds.includes(map.id)
    if (map.encounter_zones) {
      const zones = map.encounter_zones.flat()
      const counts = zones.map(countIn).filter((n) => n > 0)
      if (counts.length > 0 || fixed) {
        habitats.push({
          mapId: map.id,
          mapName: map.name,
          zones: counts.length,
          totalZones: zones.length,
          count: Math.max(0, ...counts),
          fixed,
        })
      }
    } else {
      const count = map.encounter_group == null ? 0 : countIn(map.encounter_group)
      if (count > 0 || fixed) {
        habitats.push({ mapId: map.id, mapName: map.name, zones: null, totalZones: null, count, fixed })
      }
    }
  }
  return habitats
}
