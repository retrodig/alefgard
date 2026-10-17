import { useEffect, useMemo, useRef, useState } from 'react'
import { Swords } from 'lucide-react'
import { Window } from '../../components/Window'
import { monsterLabel } from '../../data/monsters'
import { itemOptions, spellOptions } from '../../features/battle/commands'
import { cleanBattleMessages } from '../../features/battle/messages'
import { formatName } from '../../features/jumon/kana'
import { decodePassword, DEFAULT_SAVE, encodePassword } from '../../features/jumon/password'
import { loadSlots, loadStoredPassword } from '../../features/jumon/storage'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { DamdaraGame } from '../../wasm/game'
import type { BattleAction, BattleTurnResult } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import { BattleScreen, type LogLine } from './BattleScreen'
import { BattleSetup, type PlayerSource } from './BattleSetup'
import { CommandWindow } from './CommandWindow'
import styles from './Battle.module.css'

/** メッセージを 1 行ずつ表示する間隔 */
const LINE_INTERVAL_MS = 70

interface Session {
  result: BattleTurnResult
  log: LogLine[]
  /** やくそう・かぎの残り（damdara の結果には含まれないので こちらで数える） */
  herbs: number
  keys: number
}

function loadSources(): PlayerSource[] {
  const current = loadStoredPassword() ?? encodePassword(DEFAULT_SAVE)
  const slots = loadSlots().flatMap((slot, i) =>
    slot ? [{ id: `slot-${i}`, label: `スロット ${i + 1}`, password: slot.password }] : [],
  )
  return [{ id: 'current', label: 'いまの じょうたい', password: current }, ...slots]
}

function toLog(result: BattleTurnResult): LogLine[] {
  return cleanBattleMessages(result.messages).map((text) => ({ turn: result.turn, text }))
}

export function BattlePage() {
  const { createGame, getMasterData } = useDamdara()
  const master = getMasterData()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const [sources] = useState(loadSources)
  const [sourceId, setSourceId] = useState('current')
  const [monsterId, setMonsterId] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [shown, setShown] = useState(0)
  const gameRef = useRef<DamdaraGame | null>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  const source = sources.find((s) => s.id === sourceId) ?? sources[0]
  const save = useMemo(() => decodePassword(source.password).save, [source.password])

  // ページを離れたら WASM 側のゲームを解放する
  useEffect(() => () => gameRef.current?.free(), [])

  // メッセージを 1 行ずつ送り表示する（動きを減らす設定なら一度に全部出す）
  const total = session?.log.length ?? 0
  const visible = reduceMotion ? total : shown
  useEffect(() => {
    if (reduceMotion || shown >= total) return
    const id = setTimeout(() => setShown((n) => n + 1), LINE_INTERVAL_MS)
    return () => clearTimeout(id)
  }, [shown, total, reduceMotion])

  const start = () => {
    gameRef.current?.free()
    const game = createGame()
    gameRef.current = game
    game.loadFromPassword(source.password)
    const result = game.startBattle(monsterId)
    setSession({ result, log: toLog(result), herbs: save.herbs, keys: save.keys })
    setShown(0)
    screenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const command = (action: BattleAction, selection?: number) => {
    const game = gameRef.current
    if (!game || !session) return
    // やくそうは一覧の先頭（持っているとき）。使うと 1 つ減る
    const usedHerb = action === 'item' && selection === 1 && session.herbs > 0
    const result = game.battleTurn(action, selection)
    setSession({
      result,
      log: [...session.log, ...toLog(result)],
      herbs: usedHerb ? session.herbs - 1 : session.herbs,
      keys: session.keys,
    })
  }

  const playerSummary = `${formatName(save.name) || '（なまえなし）'}・けいけんち ${save.experience.toLocaleString('ja-JP')}`
  const busy = visible < total
  const result = session?.result
  const summary = result?.player_state.summary

  return (
    <div className={styles.page}>
      <div className={styles.areaSetup}>
        <BattleSetup
          sources={sources}
          sourceId={source.id}
          onSourceChange={setSourceId}
          playerSummary={playerSummary}
          monsters={master.monsters}
          monsterId={monsterId}
          onMonsterChange={setMonsterId}
          inBattle={!!result && !result.is_finished}
          onStart={start}
        />
      </div>

      <div ref={screenRef} className={styles.areaScreen}>
        {session && result && summary ? (
          <BattleScreen
            result={result}
            monsterLabel={monsterLabel({ id: result.monster_id, name: result.monster_name }, master.monsters)}
            monsterMaxHp={master.monsters.find((m) => m.id === result.monster_id)?.hp ?? 0}
            log={session.log}
            shown={visible}
            onSkip={() => setShown(session.log.length)}
            onRestart={start}
            commands={
              <CommandWindow
                spells={spellOptions(summary.level, summary.mp, master.spells)}
                items={itemOptions(session.herbs, session.keys, result.player_state.items, master.items)}
                asleep={result.player_sleep}
                disabled={busy}
                onCommand={command}
              />
            }
          />
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
