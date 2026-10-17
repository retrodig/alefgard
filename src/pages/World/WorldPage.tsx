import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, DoorOpen, MapPin, Swords } from 'lucide-react'
import { Window } from '../../components/Window'
import { storeLastMonster } from '../../features/battle/storage'
import { chunkPassword, formatName } from '../../features/jumon/kana'
import { DEFAULT_SAVE, decodePassword, encodePassword } from '../../features/jumon/password'
import { loadStoredPassword } from '../../features/jumon/storage'
import { dialogueBeforeAction, isShop, shopConversation, type Conversation } from '../../features/world/conversation'
import { dialoguePages } from '../../features/world/dialogue'
import { mapSpots } from '../../features/world/spots'
import { loadStory, storeStory, STORY_FLAGS, type Story } from '../../features/world/story'
import type { DamdaraGame } from '../../wasm/game'
import type { MapKind } from '../../wasm/types'
import { useDamdara } from '../../wasm/useDamdara'
import { getMapData, getWorldData, npcCharacterId, WORLD_MAP_ID } from '../../wasm/world'
import { MapView, type NpcView, type SpotView } from './MapView'
import { TalkWindow } from './TalkWindow'
import styles from './World.module.css'

const KIND_LABEL: Record<MapKind, string> = {
  field: 'フィールド',
  town: 'まち',
  castle: 'おしろ',
  shrine: 'ほこら',
  dungeon: 'ダンジョン',
}

/** 会話に つかう ゆうしゃの じゅもん（いまの じょうたい。なければ はじめの ゆうしゃ） */
function heroPassword(): string {
  return loadStoredPassword() ?? encodePassword(DEFAULT_SAVE)
}

/** ランダムな セリフの たね（会話ごと） */
function newSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}

interface Talk {
  mapId: number
  npcIndex: number
  speaker: string
  answers: boolean[]
  /** ランダムな セリフが こたえるたびに かわらないよう 会話ごとに きめる */
  seed: number
  conversation: Conversation
  pages: string[][]
  /** こたえた あとは つづきの ページから 出す */
  startPage: number
}

/** アレフガルドの せかい：フィールド全体の ちずから まち・しろ・ダンジョンに はいり、ひとと はなせる */
export function WorldPage() {
  const { createGame } = useDamdara()
  const world = getWorldData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [talk, setTalk] = useState<Talk | null>(null)
  const [story, setStory] = useState(loadStory)
  /** 会話の あとで きえた ひと（`マップ id:番号`） */
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set())
  const [flash, setFlash] = useState(0)
  const gameRef = useRef<DamdaraGame | null>(null)

  // ページを離れたら 会話用の ゲームを解放する
  useEffect(() => () => gameRef.current?.free(), [])

  // ?map= の マップ（ない・こわれている ときは フィールド）
  const requested = Number(params.get('map'))
  const summary = world.maps.find((m) => m.id === requested) ?? world.maps.find((m) => m.id === WORLD_MAP_ID)!
  const map = getMapData(summary.id)
  const mapName = (id: number) => world.maps.find((m) => m.id === id)?.name ?? '？'

  const spots: SpotView[] = mapSpots(map.id, world.warps).map((spot) => ({
    ...spot,
    label: spot.toMap === WORLD_MAP_ID ? 'そと（アレフガルド）' : mapName(spot.toMap),
  }))
  // 一覧では いき先ごとに 1 つ
  const destinations = [...new Map(spots.map((spot) => [spot.toMap, spot])).values()]

  const npcs: NpcView[] = map.npcs.flatMap((npc, index) => {
    if (gone.has(`${map.id}:${index}`)) return []
    const characterId = npcCharacterId(npc.sprite, map.id, story.dragonlord_defeated)
    const name = world.characters.find((c) => c.id === characterId)?.name ?? 'ひと'
    const role = world.talks.get(npc.talk_id)?.role
    return [{ index, x: npc.x, y: npc.y, characterId, name: role ?? name }]
  })

  const go = (toMap: number) => {
    setTalk(null)
    setParams(toMap === WORLD_MAP_ID ? {} : { map: String(toMap) })
  }

  /** NPC との 会話を すすめる（ゆうしゃは いまの じょうたい） */
  const converse = (
    npcIndex: number,
    answers: boolean[],
    seed: number,
  ): { conversation: Conversation; pages: string[][] } => {
    const npc = map.npcs[npcIndex]
    const info = world.talks.get(npc.talk_id)
    const password = heroPassword()
    const name = formatName(decodePassword(password).save.name) || 'ゆうしゃ'
    let conversation: Conversation
    if (info && isShop(info.kind)) {
      conversation = shopConversation(info, answers, (id) => world.dialogues.get(id))
    } else {
      gameRef.current ??= createGame()
      const game = gameRef.current
      game.loadFromPassword(password)
      const result = game.runEvent(npc.talk_id, map.id, story, answers, seed)
      const lines = result?.lines ?? []
      const texts = lines.map((line) => line.text)
      // ふっかつのじゅもん は それを おしえる セリフの すぐ あとに 出す
      if (result?.actions.some((a) => a.type === 'tell_password')) {
        const before = dialogueBeforeAction(game.getEventScript(npc.talk_id) ?? [], 'tell_password')
        const at = lines.findIndex((line) => line.dialogue_id === before)
        const rows = chunkPassword(password)
        const passwordText = `ふっかつのじゅもん\n${rows.slice(0, 2).join(' ')}\n${rows.slice(2).join(' ')}\n▼`
        texts.splice(at >= 0 ? at + 1 : texts.length, 0, passwordText)
      }
      conversation = {
        texts,
        status: result?.status ?? 'finished',
        actions: result?.actions ?? [],
        shopItems: [],
      }
    }
    return { conversation, pages: conversation.texts.flatMap((text) => dialoguePages(text, name)) }
  }

  /** 会話が おわったら すぐ おきること（ひかる・ひめを とどける） */
  const applyFinished = (conversation: Conversation) => {
    if (conversation.status !== 'finished') return
    if (conversation.actions.some((a) => a.type === 'flash')) setFlash((n) => n + 1)
    if (conversation.actions.some((a) => a.type === 'deliver_princess')) {
      changeStory({ ...story, carrying_princess: false, princess_delivered: true })
    }
  }

  const talkTo = (index: number) => {
    const seed = newSeed()
    const { conversation, pages } = converse(index, [], seed)
    const speaker = npcs.find((n) => n.index === index)?.name ?? 'ひと'
    setTalk({ mapId: map.id, npcIndex: index, speaker, answers: [], seed, conversation, pages, startPage: 0 })
    applyFinished(conversation)
  }

  const answer = (yes: boolean) => {
    if (!talk) return
    const answers = [...talk.answers, yes]
    const { conversation, pages } = converse(talk.npcIndex, answers, talk.seed)
    setTalk({ ...talk, answers, conversation, pages, startPage: talk.pages.length })
    applyFinished(conversation)
  }

  /** 会話を とじる。きえる・そとへ だされる は ここで */
  const closeTalk = () => {
    if (!talk) return
    const { actions, status } = talk.conversation
    setTalk(null)
    if (status !== 'finished') return
    if (actions.some((a) => a.type === 'npc_disappears')) {
      setGone((prev) => new Set(prev).add(`${talk.mapId}:${talk.npcIndex}`))
    }
    if (actions.some((a) => a.type === 'leave_map')) go(WORLD_MAP_ID)
  }

  const changeStory = (next: Story) => {
    setStory(next)
    storeStory(next)
  }

  const isField = map.id === WORLD_MAP_ID
  const currentTalk = talk?.mapId === map.id ? talk : null
  const battle = currentTalk?.conversation.actions.find((a) => a.type === 'battle')

  return (
    <Window
      title={map.name}
      className={styles.window}
      actions={
        <>
          <span className={styles.kind}>{KIND_LABEL[map.kind]}</span>
          {!isField && (
            <button type="button" data-variant="ghost" onClick={() => go(WORLD_MAP_ID)}>
              <ArrowLeft size={15} />
              アレフガルドへ
            </button>
          )}
        </>
      }
    >
      <div className={styles.layout}>
        <MapView key={map.id} map={map} spots={spots} npcs={npcs} onSpot={go} onTalk={talkTo} flash={flash}>
          {currentTalk && (
            <TalkWindow
              key={`${currentTalk.npcIndex}:${currentTalk.answers.join()}`}
              speaker={currentTalk.speaker}
              pages={currentTalk.pages}
              startPage={currentTalk.startPage}
              onAnswer={currentTalk.conversation.status === 'waiting_answer' ? answer : undefined}
              shopItems={currentTalk.conversation.shopItems}
              footer={
                battle && (
                  <button
                    type="button"
                    data-variant="primary"
                    onClick={() => {
                      storeLastMonster(battle.monster_id)
                      navigate('/battle')
                    }}
                  >
                    <Swords size={14} />
                    せんとうへ
                  </button>
                )
              }
              onClose={closeTalk}
            />
          )}
        </MapView>

        <aside className={styles.side}>
          <p className={styles.hint}>
            <MapPin size={13} />
            {isField
              ? 'しろ・まち・どうくつ を クリックすると なかに はいれます。'
              : npcs.length > 0
                ? 'ひとを クリックすると はなしが きけます。かいだん・でぐちから ほかの ばしょへ いけます。'
                : 'かいだん・でぐちから ほかの ばしょへ いけます。'}
          </p>

          {destinations.length > 0 && (
            <ul className={styles.places} aria-label="いける ばしょ">
              {destinations.map((spot) => (
                <li key={spot.toMap}>
                  <button type="button" onClick={() => go(spot.toMap)}>
                    <DoorOpen size={14} />
                    {spot.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <section className={styles.story} aria-label="ものがたりの すすみぐあい">
            <h3 className={styles.storyTitle}>ものがたりの すすみぐあい</h3>
            {STORY_FLAGS.map(({ key, label }) => (
              <label key={key} className={styles.storySwitch}>
                <input
                  type="checkbox"
                  checked={story[key]}
                  onChange={(e) => {
                    setTalk(null)
                    changeStory({ ...story, [key]: e.target.checked })
                  }}
                />
                {label}
              </label>
            ))}
            <p className={styles.storyNote}>
              はなしの ないようが かわります。ゆうしゃは「いまの じょうたい」（ふっかつのじゅもん ページ）です。
            </p>
          </section>
        </aside>
      </div>
    </Window>
  )
}
