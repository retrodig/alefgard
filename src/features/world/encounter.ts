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
