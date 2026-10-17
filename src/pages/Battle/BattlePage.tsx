import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollText, Swords } from 'lucide-react'
import { Window } from '../../components/Window'
import { monsterLabel } from '../../data/monsters'
import { itemOptions, spellOptions } from '../../features/battle/commands'
import { cleanBattleMessages, parseRewards } from '../../features/battle/messages'
import {
  addRecords,
  loadHistory,
  newRecordId,
  outcomeOf,
  storeHistory,
  type BattleOutcome,
  type BattleRecord,
} from '../../features/battle/history'
import { nextReveal, revealLength, speedOption } from '../../features/battle/reveal'
import { applyRewards, levelOf } from '../../features/battle/rewards'
import {
  loadAutoBattle,
  loadGainRewards,
  loadLastMonster,
  loadMessageSpeed,
  storeAutoBattle,
  storeGainRewards,
  storeLastMonster,
  type AutoBattleSetting,
} from '../../features/battle/storage'
import { formatName } from '../../features/jumon/kana'
import { decodePassword, DEFAULT_SAVE, encodePassword, type SaveData } from '../../features/jumon/password'
import { loadSlots, loadStoredPassword, storePassword, storeSlots } from '../../features/jumon/storage'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { DamdaraGame } from '../../wasm/game'
import type { BattleAction, BattleTurnResult } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import { BattleScreen, type BattlePlace, type LogLine } from './BattleScreen'
import { BattleLogDialog } from './BattleLogDialog'
import { BattleSetup, type PlayerSource } from './BattleSetup'
import styles from './Battle.module.css'

/** オートで 次のターン・次のせんとうへ進むまでの間 */
const AUTO_TURN_DELAY_MS = 300
const AUTO_NEXT_BATTLE_DELAY_MS = 900
/** けっか のみ で 1 回のせんとうが これより長く続いたら打ち切る（念のため） */
const MAX_TURNS = 300

/** オートせんとうの進みぐあい */
interface AutoRun {
  /** いま なんかいめか（1 から） */
  count: number
  total: number
  wins: number
  losses: number
  /** まけたら とめる */
  stopOnLoss: boolean
}

interface Session {
  /** たたかうたびに増やし、画面を作り直す */
  id: number
  place: BattlePlace
  monsterId: number
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
  const [autoSetting, setAutoSetting] = useState(loadAutoBattle)
  const [autoRun, setAutoRun] = useState<AutoRun | null>(null)
  const [gainRewards, setGainRewards] = useState(loadGainRewards)
  const [history, setHistory] = useState(loadHistory)
  const [logOpen, setLogOpen] = useState(false)
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

  /** せんとうを始める（target を渡すと その ゆうしゃ・モンスター・ばしょで始める） */
  const startBattle = (target?: Pick<Session, 'sourceId' | 'monsterId' | 'place'>) => {
    const from = sources.find((s) => s.id === target?.sourceId) ?? source
    const fromSave = from === source ? save : decodePassword(from.password).save
    const targetMonster = target?.monsterId ?? monsterId
    gameRef.current?.free()
    const game = createGame()
    gameRef.current = game
    game.loadFromPassword(from.password)
    const result = game.startBattle(targetMonster)
    setSession((prev) => ({
      id: (prev?.id ?? 0) + 1,
      place: target?.place ?? place,
      monsterId: targetMonster,
      sourceId: from.id,
      save: fromSave,
      rewarded: false,
      result,
      log: toLog(result),
    }))
    setShown(0)
    setIntroDone(false)
    if (!target) screenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  /** オートの「けっか のみ」：画面で たたかわず、決めた かいすう まとめて たたかい、けっか だけ メッセージに出す */
  const runResultOnly = (count: number) => {
    gameRef.current?.free()
    const game = createGame()
    gameRef.current = game
    let current = save
    let last: BattleTurnResult | null = null
    let fought = 0
    let wins = 0
    let losses = 0
    let stopped = false
    let gainedExp = 0
    let gainedGold = 0
    const records: BattleRecord[] = []
    for (let i = 0; i < count && !stopped; i++) {
      const hero = current
      game.loadFromPassword(encodePassword(hero))
      let result = game.startBattle(monsterId)
      const log = toLog(result)
      for (let turn = 0; turn < MAX_TURNS && !result.is_finished; turn++) {
        result = game.battleTurn('attack')
        log.push(...toLog(result))
      }
      if (!result.is_finished) game.endBattle()
      fought++
      last = result
      if (result.monster_defeated) {
        wins++
        const rewards = parseRewards(cleanBattleMessages(result.messages))
        gainedExp += rewards.exp
        gainedGold += rewards.gold
        if (gainRewards) current = applyRewards(current, rewards)
        if (levelOf(current.experience, master.statusTable) > levelOf(hero.experience, master.statusTable)) {
          log.push({ turn: result.turn, text: 'レベルが あがった！' })
        }
      }
      if (!result.player_survived) {
        losses++
        stopped = autoSetting.stopOnLoss
      }
      records.push(makeRecord(hero, result, log, result.is_finished ? outcomeOf(result) : 'quit'))
    }
    record(records)
    if (!last) return
    if (current !== save) saveHero(source.id, current)

    const levelBefore = levelOf(save.experience, master.statusTable)
    const levelAfter = levelOf(current.experience, master.statusTable)
    const others = fought - wins - losses
    const texts = [
      `オート けっか（${fought}せん）`,
      `${wins}しょう ${losses}はい${others > 0 ? ` ほか ${others}` : ''}`,
      // たす せっていでは 上限で止まった ぶんを のぞいた 実際の ふえかたを出す
      gainRewards
        ? `けいけんち +${current.experience - save.experience} ゴールド +${current.gold - save.gold}`
        : `けいけんち ${gainedExp} ゴールド ${gainedGold}（たさない）`,
      ...(levelAfter > levelBefore ? [`レベル ${levelBefore} → ${levelAfter}`] : []),
      ...(stopped ? [`${fought}せんめで まけたので とめた`] : []),
    ]
    const turn = last.turn
    setAutoRun(null)
    setSession((prev) => ({
      id: (prev?.id ?? 0) + 1,
      place,
      monsterId,
      sourceId: source.id,
      save: current,
      rewarded: true,
      result: last,
      log: texts.map((text) => ({ turn, text })),
    }))
    setShown(0)
    setIntroDone(false)
    screenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  /** じゅんび の「たたかう」：オートが オンなら 決めた かいすう くりかえす */
  const start = () => {
    if (autoSetting.enabled && autoSetting.resultOnly) {
      runResultOnly(autoSetting.count)
      return
    }
    setAutoRun(
      autoSetting.enabled
        ? { count: 1, total: autoSetting.count, wins: 0, losses: 0, stopOnLoss: autoSetting.stopOnLoss }
        : null,
    )
    startBattle()
  }

  /** おなじ条件で もういちど（手動で）たたかう */
  const restart = () => {
    setAutoRun(null)
    startBattle(session ?? undefined)
  }

  /** 戦闘をやめて じゅんび に戻る */
  const quit = () => {
    if (session && !session.result.is_finished && session.result.turn > 0) {
      record([makeRecord(session.save, session.result, session.log, 'quit')])
    }
    gameRef.current?.endBattle()
    setAutoRun(null)
    setSession(null)
  }

  /** せんとうの きろくを作る */
  const makeRecord = (
    hero: SaveData,
    result: BattleTurnResult,
    log: LogLine[],
    outcome: BattleOutcome = outcomeOf(result),
  ): BattleRecord => ({
    id: newRecordId(),
    at: new Date().toISOString(),
    hero: formatName(hero.name) || 'ゆうしゃ',
    monster: monsterLabel({ id: result.monster_id, name: result.monster_name }, master.monsters),
    outcome,
    turns: result.turn,
    log,
  })

  const record = (records: BattleRecord[]) => {
    if (records.length === 0) return
    setHistory((prev) => {
      const next = addRecords(prev, records)
      storeHistory(next)
      return next
    })
  }

  const clearHistory = () => {
    setHistory([])
    storeHistory([])
  }

  const changeGainRewards = (gain: boolean) => {
    setGainRewards(gain)
    storeGainRewards(gain)
  }

  const changeAutoSetting = (next: AutoBattleSetting) => {
    setAutoSetting(next)
    storeAutoBattle(next)
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

    // 勝ったら けいけんち・ゴールドを足す（たさない せっていなら そのまま）
    if (result.monster_defeated && !rewarded && gainRewards) {
      rewarded = true
      const before = next
      next = applyRewards(next, parseRewards(lines.map((line) => line.text)))
      if (levelOf(next.experience, master.statusTable) > levelOf(before.experience, master.statusTable)) {
        lines.push({ turn: result.turn, text: 'レベルが あがった！' })
      }
    }

    if (next !== session.save) saveHero(session.sourceId, next)
    const log = [...session.log, ...lines]
    if (result.is_finished) record([makeRecord(session.save, result, log)])
    setSession({ ...session, save: next, rewarded, result, log })
  }

  // オート：メッセージを出しきったら「たたかう」、決着したら 次のせんとうへ
  const busy = visible < total
  useEffect(() => {
    if (!autoRun || !session || !introDone || busy) return
    const { result } = session
    if (!result.is_finished) {
      const id = setTimeout(() => command('attack'), AUTO_TURN_DELAY_MS)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => {
      const wins = autoRun.wins + (result.monster_defeated ? 1 : 0)
      const losses = autoRun.losses + (result.player_survived ? 0 : 1)
      const stopped = !result.player_survived && autoRun.stopOnLoss
      if (stopped || autoRun.count >= autoRun.total) {
        // おわり：けっかを メッセージに足して とめる
        const text = stopped
          ? `オート ちゅうし（${autoRun.count}せんめで まけた）`
          : `オート おわり（${autoRun.total}せん ${wins}しょう${losses > 0 ? ` ${losses}はい` : ''}）`
        setSession({ ...session, log: [...session.log, { turn: result.turn, text: '' }, { turn: result.turn, text }] })
        setAutoRun(null)
        return
      }
      setAutoRun({ ...autoRun, count: autoRun.count + 1, wins, losses })
      startBattle(session)
    }, AUTO_NEXT_BATTLE_DELAY_MS)
    return () => clearTimeout(id)
  })

  const playerSummary = `${formatName(save.name) || '（なまえなし）'}・けいけんち ${save.experience.toLocaleString('ja-JP')}`
  const result = session && withRewards(session, levelOf(session.save.experience, master.statusTable))
  const summary = result?.player_state.summary
  const inBattle = (!!result && !result.is_finished) || !!autoRun

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
          gainRewards={gainRewards}
          onGainRewardsChange={changeGainRewards}
          auto={autoSetting}
          onAutoChange={changeAutoSetting}
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
              onRestart={restart}
              auto={autoRun}
              onStopAuto={() => setAutoRun(null)}
              onQuit={quit}
              onOpenLog={() => setLogOpen(true)}
            />
          </Window>
        ) : (
          <Window title="せんとう">
            <div className={styles.placeholder}>
              <Swords size={28} />
              <p>ゆうしゃ と モンスター を えらんで「たたかう」を おしてください。</p>
              {history.length > 0 && (
                <button type="button" data-variant="ghost" onClick={() => setLogOpen(true)}>
                  <ScrollText size={15} />
                  せんとうの きろく（{history.length}けん）
                </button>
              )}
            </div>
          </Window>
        )}
      </div>

      {logOpen && (
        <BattleLogDialog
          history={history}
          current={
            session && !session.result.is_finished
              ? {
                  hero: formatName(session.save.name) || 'ゆうしゃ',
                  monster: monsterLabel(
                    { id: session.result.monster_id, name: session.result.monster_name },
                    master.monsters,
                  ),
                  log: session.log,
                }
              : null
          }
          onClear={clearHistory}
          onClose={() => setLogOpen(false)}
        />
      )}
    </div>
  )
}
