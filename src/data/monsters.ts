// モンスターの表示名

/**
 * 同じなまえのモンスター（りゅうおうの第1・第2形態）を見分けられるよう、形態を付けたなまえを返す。
 * それ以外はなまえそのまま。
 */
export function monsterLabel(monster: { id: number; name: string }, monsters: { id: number; name: string }[]): string {
  const same = monsters.filter((m) => m.name === monster.name)
  if (same.length < 2) return monster.name
  const form = same.findIndex((m) => m.id === monster.id) + 1
  return `${monster.name}（だい${form}けいたい）`
}
