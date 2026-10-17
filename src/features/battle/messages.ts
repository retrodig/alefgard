// damdara の戦闘メッセージを画面表示用に整える

const DAKUTEN = /\u309b/g
const HANDAKUTEN = /\u309c/g

/** メニュー表示（コマンド？／番号つきの選択肢）と HP 表示の行 */
function isMenuOrStatus(line: string): boolean {
  return /^--- .+ ---$/.test(line) || line === 'コマンド？' || /^\d+: /.test(line) || /\bHP: \d+/.test(line)
}

/** 「た゛い＋全角空白＋ のこうげき！」→「だい のこうげき！」のように濁点を結合し、空白をまとめる */
function normalizeLine(line: string): string {
  return line
    .replace(DAKUTEN, '\u3099')
    .replace(HANDAKUTEN, '\u309a')
    .normalize('NFC')
    .replace(/[\u3000 ]+/g, ' ')
    .trim()
}

/**
 * 1 ターン分のメッセージから、メニューと HP 表示を除いて読みやすくする。
 * 空行は段落の区切りとして 1 つだけ残す。
 */
export function cleanBattleMessages(raw: string[]): string[] {
  const lines: string[] = []
  for (const entry of raw) {
    for (const part of entry.split('\n')) {
      const line = normalizeLine(part)
      if (line && isMenuOrStatus(line)) continue
      if (line === '' && (lines.length === 0 || lines[lines.length - 1] === '')) continue
      lines.push(line)
    }
  }
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

export interface BattleRewards {
  exp: number
  gold: number
}

/**
 * 整えたメッセージから、勝ったときの けいけんち・ゴールドを読み取る。
 * damdara はターン制の戦闘で勝っても player_state に加算しないため、表示側で足す。
 */
export function parseRewards(lines: string[]): BattleRewards {
  let exp = 0
  let gold = 0
  for (const line of lines) {
    const e = /けいけんち (\d+)ポイント/.exec(line)
    if (e) exp += Number(e[1])
    const g = /(\d+)ゴールドを てにいれた/.exec(line)
    if (g) gold += Number(g[1])
  }
  return { exp, gold }
}
