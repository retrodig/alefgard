// damdara 1.4.0 の WASM API が返す値の型（src/wasm.rs の構造体に対応）

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

/** せんとうの はいけい（フィールドのみ）。x / y はゲーム画面上の表示位置 */
export interface BattleBackgroundData {
  x: number
  y: number
  width: number
  height: number
  /** 16x16 のブロックを表示していく順番（[列, 行]） */
  reveal_order: [number, number][]
}

export type MapKind = 'field' | 'town' | 'castle' | 'shrine' | 'dungeon'

/** マップの情報（タイルを含まない） */
export interface MapSummary {
  id: number
  name: string
  name_en: string
  kind: MapKind
  width: number
  height: number
  border_tile: number
  npc_count: number
}

export interface NpcData {
  x: number
  y: number
  /** キャラクターの絵の番号（npc_character_id で キャラクター id に変える） */
  sprite: number
  direction: number
  moving: boolean
  talk_id: number
  /** はなしが メッセージのときの セリフの id（おみせ など とくべつな はなしでは ない） */
  dialogue_id?: number | null
  talk_kind: TalkKind
}

export type TalkKind =
  | 'weapon_shop'
  | 'item_shop'
  | 'key_shop'
  | 'fairy_water_shop'
  | 'inn'
  | 'message'
  | 'question'
  | 'event'

export interface ShopItemData {
  kind: 'weapon' | 'armor' | 'shield' | 'item' | 'herb'
  /** get_weapons などの 添字（やくそう には ない） */
  index?: number
  name: string
  price: number
}

/** NPC に はなしかけた ときに おきること（get_talk） */
export interface TalkData {
  talk_id: number
  kind: TalkKind
  items: ShopItemData[]
  /** かぎ・せいすい・やどやの ねだん */
  price?: number | null
  dialogue_id?: number | null
  yes_dialogue_id?: number | null
  no_dialogue_id?: number | null
  /** イベントの やくわり（おうさま など） */
  role?: string | null
  role_en?: string | null
  related_dialogue_ids: number[]
}

/** ものがたりの すすみぐあい（じゅもんに はいらない もの） */
export interface StoryState {
  carrying_princess?: boolean
  princess_delivered?: boolean
  left_throne_room?: boolean
  dragonlord_defeated?: boolean
}

export type EventAction =
  | { type: 'remove_curses' }
  | { type: 'restore_mp' }
  | { type: 'flash' }
  | { type: 'take_item'; item: number }
  | { type: 'give_item'; item: number }
  | { type: 'princess_takes_item'; items: number[] }
  | { type: 'npc_disappears' }
  | { type: 'leave_map' }
  | { type: 'deliver_princess' }
  | { type: 'tell_password' }
  | { type: 'exp_to_next_level' }
  | { type: 'reset_player' }
  | { type: 'game_over' }
  | { type: 'battle'; monster_id: number }

/** イベントの ながれの 1 ステップ（必要な ものだけ 型を つける） */
export type EventStep =
  | { type: 'say'; dialogue_id: number }
  | { type: 'ask' | 'ask_until_yes'; dialogue_id: number; yes: EventStep[]; no: EventStep[] }
  | { type: 'if'; condition: { type: string }; then: EventStep[]; otherwise: EventStep[] }
  | { type: 'random'; choices: { weight: number; steps: EventStep[] }[] }
  | { type: 'do'; action: EventAction }

/** run_event の けっか。lines は さいしょから ぜんぶ（こたえるたびに のびる） */
export interface EventResult {
  lines: { dialogue_id: number; text: string }[]
  actions: EventAction[]
  status: 'finished' | 'waiting_answer'
}

export interface GameMapData extends MapSummary {
  /** 行優先（index = y * width + x） */
  tiles: number[]
  npcs: NpcData[]
  treasures: TreasureData[]
  /** ダンジョンの まものの グループ（まち・しろ・ほこら・フィールドには ない） */
  encounter_group?: number | null
  /** フィールドの くかくの 大きさ（タイル） */
  encounter_zone_size?: number | null
  /** フィールドの くかくごとの グループ（[y][x]） */
  encounter_zones?: number[][] | null
}

export type TreasureContent =
  | { type: 'item'; item: number }
  | { type: 'herb' }
  | { type: 'key' }
  | { type: 'weapon'; weapon: number }
  | { type: 'armor'; armor: number }
  | { type: 'gold'; min: number; max: number }
  | { type: 'item_or_gold'; item: number; one_in: number; gold_min: number; gold_max: number }
  | { type: 'tablet' }
  | { type: 'hidden_stairs' }
  | { type: 'hint'; dialogue_id: number }
  | { type: 'decoration' }

/** この じょうけんの ときは からっぽ */
export type TreasureEmptyIf =
  | { type: 'herbs_full' }
  | { type: 'keys_full' }
  | { type: 'has_item'; item: number }
  | { type: 'has_any_item'; items: number[] }
  | { type: 'weapon_equipped'; weapon: number }
  | { type: 'armor_equipped'; armor: number }
  | { type: 'hidden_stairs_found' }

/** たからばこ（chest）と しらべると みつかる もの（hidden） */
export interface TreasureData {
  map_id: number
  x: number
  y: number
  kind: 'chest' | 'hidden'
  content: TreasureContent
  name?: string | null
  empty_if?: TreasureEmptyIf | null
}

/** その ばしょで でてくる まもの（get_encounters） */
export interface EncounterData {
  map_id: number
  x: number
  y: number
  group?: number | null
  /** 5 ひき（それぞれ 1/5） */
  monsters: { id: number; name: string }[]
  /** 1 ぽ あるくごとに 1/one_in で せんとう（まち など では ない） */
  one_in?: number | null
  /** かならず でてくる まもの（once：いちど たおすと でない） */
  fixed?: { monster: { id: number; name: string }; once: boolean } | null
}

/** かいだん・いりぐち：[マップ id, x, y] から [マップ id, x, y] へ */
export interface WarpData {
  from: [number, number, number]
  to: [number, number, number]
}

export interface DialogueData {
  id: number
  text: string
}

export interface CharacterSpriteSummary {
  id: number
  name: string
  name_en: string
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
