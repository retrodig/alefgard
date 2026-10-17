// damdara の セリフを 画面に出せる形にする。
// 改行は \n、▼ は ページ送り。{player} は ゆうしゃの なまえ、{word} {number} は ばめんで かわる ことば、{wait} は ボタン待ち。

/** ばめんで かわる ことば（じゅもん・どうぐの なまえ、かず）の かわりに出す */
const PLACEHOLDER = '〇〇'

/** セリフを ページ（▼ ごと）に分け、それぞれを 行に分ける */
export function dialoguePages(text: string, playerName: string): string[][] {
  const body = text
    .replaceAll('{player}', playerName)
    .replaceAll('{word}', PLACEHOLDER)
    .replaceAll('{number}', PLACEHOLDER)
    .replaceAll('{wait}', '')
  return body
    .split('▼')
    .map((page) =>
      page
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line !== ''),
    )
    .filter((lines) => lines.length > 0)
}
