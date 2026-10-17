// せんとうメッセージの文字送り。
// 表示済みの量を「文字数」で数える（空行も 1 文字ぶんとして数え、行の間で少し待つ）。

export type MessageSpeed = 'slow' | 'normal' | 'fast' | 'instant'

export interface MessageSpeedOption {
  id: MessageSpeed
  label: string
  /** 1 回に進める間隔（ミリ秒） */
  intervalMs: number
  /** true なら 1 行ずつ、false なら 1 文字ずつ進める */
  byLine: boolean
}

export const MESSAGE_SPEEDS: readonly MessageSpeedOption[] = [
  { id: 'slow', label: 'おそい', intervalMs: 70, byLine: false },
  { id: 'normal', label: 'ふつう', intervalMs: 40, byLine: false },
  { id: 'fast', label: 'はやい', intervalMs: 15, byLine: false },
  { id: 'instant', label: 'ちょうはやい', intervalMs: 70, byLine: true },
]

export const DEFAULT_MESSAGE_SPEED: MessageSpeed = 'normal'

export function speedOption(speed: MessageSpeed): MessageSpeedOption {
  return MESSAGE_SPEEDS.find((s) => s.id === speed) ?? MESSAGE_SPEEDS[1]
}

/** 1 行の長さ（空行も 1） */
function lineCost(text: string): number {
  return Math.max(Array.from(text).length, 1)
}

/** すべての行を出しきるまでの文字数 */
export function revealLength(lines: string[]): number {
  return lines.reduce((sum, text) => sum + lineCost(text), 0)
}

/** shown の次に進める位置（1 文字先、または いまの行の終わり） */
export function nextReveal(lines: string[], shown: number, byLine: boolean): number {
  if (!byLine) return shown + 1
  let end = 0
  for (const text of lines) {
    end += lineCost(text)
    if (end > shown) return end
  }
  return end
}

/** shown 文字ぶんだけ出した行（まだ出していない行は含めない） */
export function revealLines(lines: string[], shown: number): string[] {
  const visible: string[] = []
  let rest = shown
  for (const text of lines) {
    if (rest <= 0) break
    const chars = Array.from(text)
    visible.push(chars.slice(0, rest).join(''))
    rest -= lineCost(text)
  }
  return visible
}
