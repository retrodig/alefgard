// ふっかつのじゅもんのエンコード・デコード
// damdara（https://github.com/retrodig/damdara）の save.rs / load.rs を TypeScript に移植したもの。
//   Copyright (c) 2025 Daisuke Takayama
//   Released under the MIT License: https://github.com/retrodig/damdara/blob/main/LICENSE
// damdara 0.8.4 の WASM は名前以外のパラメータを指定できないため、生成はこちらで行い、
// ステータス計算は生成したじゅもんを damdara に読ませて行う。

import { NAME_CHARS, NAME_MAX_LENGTH, PASSWORD_CHARS, PASSWORD_LENGTH } from './kana'

export interface SaveFlags {
  /** りゅうのうろこを装備した */
  hasDragonScale: boolean
  /** せんしのゆびわを装備した */
  hasWarriorRing: boolean
  /** しのくびかざりを入手した */
  hasCursedNecklace: boolean
  /** ドラゴンを倒した */
  defeatedDragon: boolean
  /** ゴーレムを倒した */
  defeatedGolem: boolean
}

export interface SaveData {
  /** damdara 形式のなまえ（濁点を分けた 4 文字、足りない分は全角空白） */
  name: string
  experience: number
  gold: number
  weapon: number
  armor: number
  shield: number
  /** どうぐ 8 枠（0 = なし） */
  items: number[]
  herbs: number
  keys: number
  flags: SaveFlags
  /** 同じ内容でも別のじゅもんになる 0〜7 の値 */
  pattern: number
}

export const LIMITS = {
  experience: 65535,
  gold: 65535,
  weapon: 7,
  armor: 7,
  shield: 3,
  item: 15,
  herbs: 6,
  keys: 6,
  pattern: 7,
  itemSlots: 8,
} as const

const BLANK = NAME_CHARS[NAME_CHARS.length - 1]

export const DEFAULT_SAVE: SaveData = {
  name: 'ゆうてい',
  experience: 0,
  gold: 0,
  weapon: 0,
  armor: 0,
  shield: 0,
  items: Array(LIMITS.itemSlots).fill(0),
  herbs: 0,
  keys: 0,
  flags: {
    hasDragonScale: false,
    hasWarriorRing: false,
    hasCursedNecklace: false,
    defeatedDragon: false,
    defeatedGolem: false,
  },
  pattern: 0,
}

/** なまえを 4 文字に切りそろえ、足りない分を全角空白で埋める */
export function padName(name: string): string {
  const chars = [...name].slice(0, NAME_MAX_LENGTH)
  while (chars.length < NAME_MAX_LENGTH) chars.push(BLANK)
  return chars.join('')
}

function nameIndices(name: string): number[] {
  return [...padName(name)].map((c) => {
    const i = (NAME_CHARS as readonly string[]).indexOf(c)
    if (i < 0) throw new Error(`なまえに使えない文字です: ${c}`)
    return i
  })
}

const clamp = (v: number, max: number) => Math.min(Math.max(Math.trunc(v) || 0, 0), max)

/** CRC（多項式 0x1021）の下位 8bit。bytes[1..14] から計算する */
function checksum(bytes: number[]): number {
  let crc = 0
  for (let i = 1; i < 15; i++) {
    let octet = bytes[i]
    for (let b = 0; b < 8; b++) {
      const carry = (((crc >> 8) ^ octet) & 0x80) !== 0
      crc = (crc << 1) & 0xffff
      octet = (octet << 1) & 0xff
      if (carry) crc ^= 0x1021
    }
  }
  return crc & 0xff
}

function toBytes(save: SaveData): number[] {
  const [n1, n2, n3, n4] = nameIndices(save.name)
  const exp = clamp(save.experience, LIMITS.experience)
  const gold = clamp(save.gold, LIMITS.gold)
  const item = (i: number) => clamp(save.items[i] ?? 0, LIMITS.item)
  const pattern = clamp(save.pattern, LIMITS.pattern)
  const bit = (v: boolean) => (v ? 1 : 0)
  const f = save.flags

  const bytes = [
    0,
    exp & 0xff,
    (((pattern >> 2) & 1) << 7) | (bit(f.hasCursedNecklace) << 6) | n3,
    (item(3) << 4) | item(2),
    gold & 0xff,
    (n1 << 2) | (bit(f.defeatedGolem) << 1) | ((pattern >> 1) & 1),
    (item(7) << 4) | item(6),
    ((pattern & 1) << 7) | (bit(f.defeatedDragon) << 6) | n4,
    (clamp(save.weapon, LIMITS.weapon) << 5) | (clamp(save.armor, LIMITS.armor) << 2) | clamp(save.shield, LIMITS.shield),
    gold >> 8,
    (clamp(save.keys, 15) << 4) | clamp(save.herbs, 15),
    (item(5) << 4) | item(4),
    exp >> 8,
    (bit(f.hasDragonScale) << 7) | (n2 << 1) | bit(f.hasWarriorRing),
    (item(1) << 4) | item(0),
  ]
  bytes[0] = checksum(bytes)
  return bytes
}

/** パラメータからじゅもんを作る */
export function encodePassword(save: SaveData): string {
  const bytes = toBytes(save)
  const values: number[] = []
  for (let block = 0; block < 5; block++) {
    const [a, b, c] = bytes.slice(block * 3, block * 3 + 3)
    // 3 バイトを逆順に並べた 24bit を 6bit × 4 に分け、後ろから並べる
    const combined = (c << 16) | (b << 8) | a
    values.push(combined & 0x3f, (combined >> 6) & 0x3f, (combined >> 12) & 0x3f, (combined >> 18) & 0x3f)
  }
  let previous = 0
  return values
    .map((v) => {
      previous = (v + 4 + previous) & 0x3f
      return PASSWORD_CHARS[previous]
    })
    .join('')
}

export interface DecodeResult {
  save: SaveData
  /** チェックサムが一致しない（ゲームでは受け付けられない）じゅもんなら false */
  checksumValid: boolean
}

/** じゅもんからパラメータを取り出す。文字数・文字が不正なら Error を投げる */
export function decodePassword(password: string): DecodeResult {
  const chars = [...password]
  if (chars.length !== PASSWORD_LENGTH) throw new Error(`じゅもんは ${PASSWORD_LENGTH} 文字です`)
  const encoded = chars.map((c) => {
    const i = (PASSWORD_CHARS as readonly string[]).indexOf(c)
    if (i < 0) throw new Error(`じゅもんに使えない文字です: ${c}`)
    return i
  })
  const values = encoded.map((v, i) => (v - 4 - (i === 0 ? 0 : encoded[i - 1]) + 128) & 0x3f)

  const bytes: number[] = []
  for (let block = 0; block < 5; block++) {
    const [v1, v2, v3, v4] = values.slice(block * 4, block * 4 + 4)
    const combined = (v4 << 18) | (v3 << 12) | (v2 << 6) | v1
    bytes.push(combined & 0xff, (combined >> 8) & 0xff, (combined >> 16) & 0xff)
  }

  const nameChars = [bytes[5] >> 2, (bytes[13] >> 1) & 0x3f, bytes[2] & 0x3f, bytes[7] & 0x3f].map((i) => NAME_CHARS[i])

  const save: SaveData = {
    name: nameChars.join(''),
    experience: (bytes[12] << 8) | bytes[1],
    gold: (bytes[9] << 8) | bytes[4],
    weapon: bytes[8] >> 5,
    armor: (bytes[8] >> 2) & 0x07,
    shield: bytes[8] & 0x03,
    items: [
      bytes[14] & 0x0f,
      bytes[14] >> 4,
      bytes[3] & 0x0f,
      bytes[3] >> 4,
      bytes[11] & 0x0f,
      bytes[11] >> 4,
      bytes[6] & 0x0f,
      bytes[6] >> 4,
    ],
    herbs: bytes[10] & 0x0f,
    keys: bytes[10] >> 4,
    flags: {
      hasDragonScale: ((bytes[13] >> 7) & 1) === 1,
      hasWarriorRing: (bytes[13] & 1) === 1,
      hasCursedNecklace: ((bytes[2] >> 6) & 1) === 1,
      defeatedDragon: ((bytes[7] >> 6) & 1) === 1,
      defeatedGolem: ((bytes[5] >> 1) & 1) === 1,
    },
    pattern: ((bytes[7] >> 7) & 1) | ((bytes[5] & 1) << 1) | (((bytes[2] >> 7) & 1) << 2),
  }
  return { save, checksumValid: checksum(bytes) === bytes[0] }
}
