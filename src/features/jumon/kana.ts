// ふっかつのじゅもん・なまえで使える文字（damdara の PASSWORD_TABLE / KANA_TABLE に対応）

export const PASSWORD_LENGTH = 20
export const NAME_MAX_LENGTH = 4

/** じゅもんに使われる 64 文字 */
export const PASSWORD_CHARS = [
  'あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た',
  'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み',
  'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'が', 'ぎ', 'ぐ', 'げ',
  'ご', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ',
] as const

/** なまえに使える 64 文字（濁点・半濁点は 1 文字として数える） */
export const NAME_CHARS = [
  '０', '１', '２', '３', '４', '５', '６', '７', '８', '９', 'あ', 'い', 'う', 'え', 'お', 'か',
  'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に',
  'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ',
  'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん', 'っ', 'ゃ', 'ゅ', 'ょ', '゛', '゜', '－', '　',
] as const

const PASSWORD_CHAR_SET: ReadonlySet<string> = new Set(PASSWORD_CHARS)
const NAME_CHAR_SET: ReadonlySet<string> = new Set(NAME_CHARS)

const DAKUTEN = '゛'
const HANDAKUTEN = '゜'

/** カタカナ（ァ〜ヶ）をひらがなにする */
export function katakanaToHiragana(s: string): string {
  return s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

/** 単独の濁点・半濁点（゛゜ ﾞ ﾟ）を結合文字にそろえ、全角・半角の揺れを吸収する */
function unifyWidth(s: string): string {
  return s
    .replace(/[\u309b\uff9e]/g, '\u3099')
    .replace(/[\u309c\uff9f]/g, '\u309a')
    .normalize('NFKC')
}

export interface CharCheck {
  char: string
  valid: boolean
}

export interface NormalizedPassword {
  /** 空白を除き、ひらがなにそろえた文字列 */
  value: string
  chars: CharCheck[]
  /** 20 文字ちょうどで、すべて使える文字なら true */
  complete: boolean
}

/** コピペされたじゅもんを正規化する（空白除去・カタカナ→ひらがな・濁点の結合） */
export function normalizePassword(input: string): NormalizedPassword {
  const value = katakanaToHiragana(unifyWidth(input)).replace(/\s/g, '')
  const chars = [...value].map((char) => ({ char, valid: PASSWORD_CHAR_SET.has(char) }))
  const complete = chars.length === PASSWORD_LENGTH && chars.every((c) => c.valid)
  return { value, chars, complete }
}

export interface NormalizedName {
  /** damdara に渡す形（だ → た゛ のように濁点を分ける） */
  value: string
  /** 濁点を 1 文字と数えた文字の一覧 */
  chars: CharCheck[]
  valid: boolean
}

/** 入力されたなまえを damdara の文字表に合わせて正規化する */
export function normalizeName(input: string): NormalizedName {
  const hiragana = katakanaToHiragana(unifyWidth(input))
    .replace(/[\s]/g, '')
    .replace(/[ー‐－−-]/g, '－')
    .replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0))
  const value = hiragana.normalize('NFD').replace(/\u3099/g, DAKUTEN).replace(/\u309a/g, HANDAKUTEN)
  const chars = [...value].map((char) => ({ char, valid: NAME_CHAR_SET.has(char) }))
  const valid = chars.length > 0 && chars.length <= NAME_MAX_LENGTH && chars.every((c) => c.valid)
  return { value, chars, valid }
}

/** damdara が返すなまえ（「た゛い」＋全角空白埋め）を表示用（だい）にする */
export function formatName(name: string): string {
  return name
    .replace(/\s+$/u, '')
    .replace(new RegExp(DAKUTEN, 'g'), '\u3099')
    .replace(new RegExp(HANDAKUTEN, 'g'), '\u309a')
    .normalize('NFC')
}

/** じゅもんを 5 文字ずつに区切る（当時の表示形式） */
export function chunkPassword(value: string, size = 5): string[] {
  const chars = [...value]
  const rows: string[] = []
  for (let i = 0; i < chars.length; i += size) rows.push(chars.slice(i, i + size).join(''))
  return rows
}
