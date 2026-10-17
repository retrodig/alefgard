import type { WasmGame } from 'damdara'
import type {
  BattleAction,
  BattleBackgroundData,
  BattleResult,
  BattleStep,
  BattleTurnResult,
  EnemySpriteSummary,
  EquipmentData,
  MonsterData,
  PlayerState,
  SpellData,
  StatusData,
} from './types'

/** WASM の例外（JsValue の文字列）を Error に変換する */
function toError(e: unknown): Error {
  if (e instanceof Error) return e
  return new Error(typeof e === 'string' ? e : String(e))
}

function call<T>(fn: () => T): T {
  try {
    return fn()
  } catch (e) {
    throw toError(e)
  }
}

/** damdara の WasmGame を型付きで扱うラッパー。WASM の初期化は呼び出し側で済ませておく */
export class DamdaraGame {
  private readonly game: WasmGame

  constructor(game: WasmGame) {
    this.game = game
  }

  createPlayer(name: string): PlayerState {
    return call(() => this.game.create_player(name))
  }

  loadFromPassword(password: string): PlayerState {
    return call(() => this.game.load_from_password(password))
  }

  generatePassword(): string {
    return call(() => this.game.generate_password())
  }

  getPlayerState(): PlayerState {
    return call(() => this.game.get_player_state())
  }

  hasPlayer(): boolean {
    return this.game.has_player()
  }

  /** 行動列を積んで決着まで戦闘を実行する。行動が尽きると以降は「たたかう」になる */
  runBattle(monsterId: number, steps: BattleStep[] = []): BattleResult {
    return call(() => {
      this.game.clear_battle_input()
      for (const step of steps) {
        this.game.queue_battle_action(step.action)
        if (step.input !== undefined) this.game.queue_battle_input(step.input)
      }
      return this.game.run_battle(monsterId)
    })
  }

  /** ターン制の戦闘を始める（turn 0：モンスター出現）。戦闘中なら破棄して始め直す */
  startBattle(monsterId: number): BattleTurnResult {
    return call(() => this.game.start_battle(monsterId))
  }

  /** 1 ターン進める。じゅもん・どうぐのときは selection に 1 始まりの番号を渡す */
  battleTurn(action: BattleAction, selection?: number): BattleTurnResult {
    return call(() => this.game.battle_turn(action, selection ?? null))
  }

  isInBattle(): boolean {
    return this.game.is_in_battle()
  }

  /** 戦闘を中断する（プレイヤーの状態は残る） */
  endBattle(): void {
    this.game.end_battle()
  }

  getEnemySprites(): EnemySpriteSummary[] {
    return call(() => this.game.get_enemy_sprites())
  }

  /** 敵スプライトの RGBA（width * height * 4 バイト） */
  getEnemySpriteRgba(id: number): Uint8Array {
    return call(() => this.game.get_enemy_sprite_rgba(id))
  }

  /** せんとうの はいけい。はいけいの無いマップでは null */
  getBattleBackground(mapId: number): BattleBackgroundData | null {
    return call(() => this.game.get_battle_background(mapId) ?? null)
  }

  /** はいけいの RGBA（112 * 112 * 4 バイト）。revealBlocks を渡すと そのブロック数だけ描く（出現アニメーション用） */
  getBattleBackgroundRgba(mapId: number, revealBlocks?: number): Uint8Array {
    return call(() => this.game.get_battle_background_rgba(mapId, revealBlocks ?? null))
  }

  /** はいけいの無いせんとうで塗りつぶす色（NES の色番号） */
  getBattleBackdrop(): number {
    return this.game.get_battle_backdrop()
  }

  /** NES の色番号 → [r, g, b] */
  getNesPalette(): [number, number, number][] {
    return call(() => this.game.get_nes_palette())
  }

  getMonsters(): MonsterData[] {
    return call(() => this.game.get_monsters())
  }

  getWeapons(): EquipmentData[] {
    return call(() => this.game.get_weapons())
  }

  getArmors(): EquipmentData[] {
    return call(() => this.game.get_armors())
  }

  getShields(): EquipmentData[] {
    return call(() => this.game.get_shields())
  }

  getItems(): EquipmentData[] {
    return call(() => this.game.get_items())
  }

  getSpells(): SpellData[] {
    return call(() => this.game.get_spells())
  }

  getStatusTable(): StatusData[] {
    return call(() => this.game.get_status_table())
  }

  free(): void {
    this.game.free()
  }
}
