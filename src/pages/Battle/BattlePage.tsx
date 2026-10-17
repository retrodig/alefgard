import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Swords } from 'lucide-react'
import { Window } from '../../components/Window'
import { monsterLabel } from '../../data/monsters'
import { itemOptions, spellOptions } from '../../features/battle/commands'
import { cleanBattleMessages, parseRewards } from '../../features/battle/messages'
import { nextReveal, revealLength, speedOption } from '../../features/battle/reveal'
import { applyRewards, levelOf } from '../../features/battle/rewards'
import { loadLastMonster, loadMessageSpeed, storeLastMonster } from '../../features/battle/storage'
import { formatName } from '../../features/jumon/kana'
import { decodePassword, DEFAULT_SAVE, encodePassword, type SaveData } from '../../features/jumon/password'
import { loadSlots, loadStoredPassword, storePassword, storeSlots } from '../../features/jumon/storage'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { DamdaraGame } from '../../wasm/game'
import type { BattleAction, BattleTurnResult } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import { BattleScreen, type BattlePlace, type LogLine } from './BattleScreen'
import { BattleSetup, type PlayerSource } from './BattleSetup'
import styles from './Battle.module.css'

interface Session {
  /** たたかうたびに増やし、画面を作り直す */
  id: number
  place: BattlePlace
  /** たたかっている ゆうしゃ（やくそうを使ったとき・勝ったときに この じゅもんを書きかえる） */
  sourceId: string
  /**
   * いまの ゆうしゃ（書きかえたあとの状態）。
   * やくそうの残りは damdara の結果に含まれないので、ここで数える
   */
  save: SaveData
  /** 勝って けいけんち・ゴールドを足した */
  rewarded: boolean
  result: BattleTurnResult
  log: LogLine[]
}

const SLOT_PREFIX = 'slot-'

function loadSources(): PlayerSource[] {
  const current = loadStoredPassword() ?? encodePassword(DEFAULT_SAVE)
  const slots = loadSlots().flatMap((slot, i) =>
    slot ? [{ id: `${SLOT_PREFIX}${i}`, label: `スロット ${i + 1}`, password: slot.password }] : [],
  )
  return [{ id: 'current', label: 'いまの じょうたい', password: current }, ...slots]
}

/** ゆうしゃの じゅもんを、えらんだ元（いまの じょうたい／スロット）に書きもどす */
function storeSource(sourceId: string, password: string): void {
  if (sourceId === 'current') {
    storePassword(password)
    return
  }
  const index = Number(sourceId.slice(SLOT_PREFIX.length))
  const slots = loadSlots()
  if (!slots[index]) return
  slots[index] = { password, savedAt: new Date().toISOString() }
  storeSlots(slots)
}

function toLog(result: BattleTurnResult): LogLine[] {
  return cleanBattleMessages(result.messages).map((text) => ({ turn: result.turn, text }))
}

/** damdara は勝っても けいけんち・ゴールドを加算しないので、足したあとの値を表示に使う */
function withRewards(session: Session, level: number): BattleTurnResult {
  const { result, rewarded, save } = session
  if (!rewarded) return result
  const { summary } = result.player_state
  return {
    ...result,
    player_state: {
      ...result.player_state,
      summary: { ...summary, level, experience: save.experience, gold: save.gold },
    },
  }
}

export function BattlePage() {
  const { createGame, getMasterData } = useDamdara()
  const master = getMasterData()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const [sources, setSources] = useState(loadSources)
  const [sourceId, setSourceId] = useState('current')
  // さいごに えらんだ モンスター（いまは いない id なら 先頭）
  const [monsterId, setMonsterId] = useState(() => {
    const last = loadLastMonster()
    return master.monsters.some((m) => m.id === last) ? (last as number) : (master.monsters[0]?.id ?? 0)
  })
  const [speed] = useState(() => speedOption(loadMessageSpeed()))
  const [place, setPlace] = useState<BattlePlace>('field')
  const [session, setSession] = useState<Session | null>(null)
  const [shown, setShown] = useState(0)
  /** はいけいの出現が終わるまで メッセージを出さない */
  const [introDone, setIntroDone] = useState(false)
  const gameRef = useRef<DamdaraGame | null>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  const source = sources.find((s) => s.id === sourceId) ?? sources[0]
  const save = useMemo(() => decodePassword(source.password).save, [source.password])

  // ページを離れたら WASM 側のゲームを解放する
  useEffect(() => () => gameRef.current?.free(), [])

  // メッセージを 1 文字ずつ（ちょうはやい なら 1 行ずつ）送り表示する。動きを減らす設定なら一度に全部出す
  const texts = useMemo(() => session?.log.map((line) => line.text) ?? [], [session?.log])
  const total = revealLength(texts)
  const visible = reduceMotion ? total : introDone ? shown : 0
  useEffect(() => {
    if (reduceMotion || !introDone || shown >= total) return
    const id = setTimeout(() => setShown((n) => nextReveal(texts, n, speed.byLine)), speed.intervalMs)
    return () => clearTimeout(id)
  }, [shown, total, texts, speed, reduceMotion, introDone])

  const changeMonster = (id: number) => {
    setMonsterId(id)
    storeLastMonster(id)
  }

  const endIntro = useCallback(() => setIntroDone(true), [])

  const start = () => {
    gameRef.current?.free()
    const game = createGame()
    gameRef.current = game
    game.loadFromPassword(source.password)
    const result = game.startBattle(monsterId)
    setSession((prev) => ({
      id: (prev?.id ?? 0) + 1,
      place,
      sourceId: source.id,
      save,
      rewarded: false,
      result,
      log: toLog(result),
    }))
    setShown(0)
    setIntroDone(false)
    screenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  /** 戦闘をやめて じゅんび に戻る */
  const quit = () => {
    gameRef.current?.endBattle()
    setSession(null)
  }

  /** ゆうしゃの じゅもんを書きかえて、えらんだ元（いまの じょうたい／スロット）に保存する */
  const saveHero = (sourceId: string, next: SaveData) => {
    const password = encodePassword(next)
    storeSource(sourceId, password)
    setSources((prev) => prev.map((s) => (s.id === sourceId ? { ...s, password } : s)))
  }

  const command = (action: BattleAction, selection?: number) => {
    const game = gameRef.current
    if (!game || !session) return
    const result = game.battleTurn(action, selection)
    const lines = toLog(result)
    let next = session.save
    let rewarded = session.rewarded

    // やくそうは一覧の先頭（持っているとき）。使ったら 1 つ減らす
    if (action === 'item' && selection === 1 && next.herbs > 0) {
      next = { ...next, herbs: next.herbs - 1 }
    }

    // 勝ったら けいけんち・ゴールドを足す
    if (result.monster_defeated && !rewarded) {
      rewarded = true
      const before = next
      next = applyRewards(next, parseRewards(lines.map((line) => line.text)))
      if (levelOf(next.experience, master.statusTable) > levelOf(before.experience, master.statusTable)) {
        lines.push({ turn: result.turn, text: 'レベルが あがった！' })
      }
    }

    if (next !== session.save) saveHero(session.sourceId, next)
    setSession({ ...session, save: next, rewarded, result, log: [...session.log, ...lines] })
  }

  const playerSummary = `${formatName(save.name) || '（なまえなし）'}・けいけんち ${save.experience.toLocaleString('ja-JP')}`
  const result = session && withRewards(session, levelOf(session.save.experience, master.statusTable))
  const summary = result?.player_state.summary
  const inBattle = !!result && !result.is_finished

  return (
    // タブレット以下では 戦闘中は じゅんび を隠す（CSS で切り替える）
    <div className={styles.page} data-in-battle={inBattle || undefined}>
      <div className={styles.areaSetup}>
        <BattleSetup
          sources={sources}
          sourceId={source.id}
          onSourceChange={setSourceId}
          playerSummary={playerSummary}
          monsters={master.monsters}
          monsterId={monsterId}
          onMonsterChange={changeMonster}
          place={place}
          onPlaceChange={setPlace}
          inBattle={inBattle}
          onStart={start}
        />
      </div>

      <div ref={screenRef} className={styles.areaScreen}>
        {session && result && summary ? (
          <Window title="せんとう" className={styles.screenWindow}>
            <BattleScreen
              key={session.id}
              result={result}
              monsterLabel={monsterLabel({ id: result.monster_id, name: result.monster_name }, master.monsters)}
              monsterMaxHp={master.monsters.find((m) => m.id === result.monster_id)?.hp ?? 0}
              place={session.place}
              log={session.log}
              shown={visible}
              reduceMotion={reduceMotion}
              onIntroEnd={endIntro}
              onSkip={() => setShown(total)}
              spells={spellOptions(summary.level, summary.mp, master.spells)}
              items={itemOptions(session.save.herbs, session.save.keys, result.player_state.items, master.items)}
              onCommand={command}
              onRestart={start}
              onQuit={quit}
            />
          </Window>
        ) : (
          <Window title="せんとう">
            <div className={styles.placeholder}>
              <Swords size={28} />
              <p>ゆうしゃ と モンスター を えらんで「たたかう」を おしてください。</p>
            </div>
          </Window>
        )}
      </div>
    </div>
  )
}
