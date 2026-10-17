// damdara 0.8.4 の WASM API が返す値の型（src/wasm.rs の構造体に対応）

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
