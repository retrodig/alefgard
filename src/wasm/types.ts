// damdara 0.10.0 の WASM API が返す値の型（src/wasm.rs の構造体に対応）

export interface PlayerSummary {
  name: string
  level: number
  hp: number
  mp: number
  gold: number
  experience: number
}

export interface StrengthStatus {
  level: number
  strength: number
  agility: number
  max_hp: number
  max_mp: number
  attack_power: number
  defense_power: number
  weapon: string
  armor: string
  shield: string
}

export interface PlayerState {
  summary: PlayerSummary
  strength_status: StrengthStatus
  items: string[]
}

export interface BattleResult {
  player_survived: boolean
  monster_defeated: boolean
  player_escaped: boolean
  monster_escaped: boolean
  messages: string[]
  final_player_state: PlayerState
}

/** ターン制戦闘（start_battle / battle_turn）の 1 ターン分の結果 */
export interface BattleTurnResult {
  /** 0 は出現時、以降は 1 ターンごとに増える */
  turn: number
  is_finished: boolean
  player_survived: boolean
  monster_defeated: boolean
  player_escaped: boolean
  monster_escaped: boolean
  monster_id: number
  monster_name: string
  monster_hp: number
  player_sleep: boolean
  player_seal: boolean
  monster_sleep: boolean
  monster_seal: boolean
  messages: string[]
  player_state: PlayerState
}

/** 敵スプライトの情報（画素は含まない）。x / y はゲーム画面上の表示位置 */
export interface EnemySpriteSummary {
  id: number
  name: string
  mirror: boolean
  x: number
  y: number
  width: number
  height: number
  part_count: number
}

export interface MonsterData {
  id: number
  name: string
  hp: number
  attack: number
  defense: number
  exp: number
  gold: number
}

export interface EquipmentData {
  id: number
  name: string
  price: number
  sell: number
  attack: number
  defense: number
}

export interface SpellData {
  id: number
  name: string
  learn_level: number
  mp_cost: number
  description: string
}

export interface StatusData {
  level: number
  strength: number
  agility: number
  max_hp: number
  max_mp: number
  required_exp: number
  /** じゅもんを覚えないレベルでは省略される */
  spell?: string | null
}

export type BattleAction = 'attack' | 'spell' | 'item' | 'escape'

export interface BattleStep {
  action: BattleAction
  /** じゅもん・どうぐ選択時のメニュー番号 */
  input?: number
}
