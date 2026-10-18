import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, MapPin, Swords, X } from 'lucide-react'
import { SpriteViewer } from '../../components/SpriteViewer'
import { Window } from '../../components/Window'
import { storeLastMonster } from '../../features/battle/storage'
import { habitatsOf } from '../../features/world/encounter'
import type { MonsterData } from '../../wasm/types'
import { getEncounterGroups, getFixedEncounters, getMapData, getWorldData } from '../../wasm/world'
import styles from './MonsterDialog.module.css'

interface Props {
  monster: MonsterData
  /** 形態つきの表示名 */
  label: string
  /** まえ・つぎ の モンスターへ（なければ はし） */
  onPrev?: () => void
  onNext?: () => void
  onClose: () => void
}

/** モンスターの くわしい 画面：拡大できる すがた と パラメータ・でる ばしょ */
export function MonsterDialog({ monster, label, onPrev, onNext, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => dialogRef.current?.close()

  // でる ばしょ（フィールドは くかくの かず、かならず でる ばしょ も）
  const maps = getWorldData().maps.map((m) => getMapData(m.id))
  const fixedMapIds = maps
    .filter((m) => getFixedEncounters(m.id).some((e) => e.fixed?.monster.id === monster.id))
    .map((m) => m.id)
  const habitats = habitatsOf(monster.id, maps, getEncounterGroups(), fixedMapIds)

  const params: [string, number][] = [
    ['HP', monster.hp],
    ['こうげき', monster.attack],
    ['しゅび', monster.defense],
    ['けいけんち', monster.exp],
    ['ゴールド', monster.gold],
  ]

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={`${label}の くわしい じょうほう`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      onKeyDown={(e) => {
        // ← → で まえ・つぎ（拡大中の いどう と かさならないよう 修飾キーなし・ビューアの そと だけ）
        if ((e.target as HTMLElement).closest('[data-viewer]')) return
        if (e.key === 'ArrowLeft' && onPrev) onPrev()
        if (e.key === 'ArrowRight' && onNext) onNext()
      }}
    >
      <Window
        title={`No.${monster.id + 1} ${label}`}
        className={styles.window}
        actions={
          <>
            <button
              type="button"
              data-variant="ghost"
              aria-label="まえの モンスター"
              disabled={!onPrev}
              onClick={onPrev}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              data-variant="ghost"
              aria-label="つぎの モンスター"
              disabled={!onNext}
              onClick={onNext}
            >
              <ChevronRight size={16} />
            </button>
            <button type="button" data-variant="ghost" aria-label="とじる" onClick={close}>
              <X size={16} />
            </button>
          </>
        }
      >
        <div className={styles.body}>
          <div className={styles.viewer} data-viewer>
            {/* モンスターを かえたら 拡大を もどす */}
            <SpriteViewer key={monster.id} monsterId={monster.id} label={label} size="large" />
          </div>

          <div className={styles.side}>
            <dl className={styles.params}>
              {params.map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <section aria-label="でる ばしょ">
              <h3 className={styles.heading}>でる ばしょ</h3>
              {habitats.length > 0 ? (
                <ul className={styles.habitats}>
                  {habitats.map((h) => (
                    <li key={h.mapId}>
                      <button
                        type="button"
                        data-variant="ghost"
                        onClick={() => navigate(h.mapId === 1 ? '/world' : `/world?map=${h.mapId}`)}
                      >
                        <MapPin size={13} />
                        <span className={styles.habitatName}>{h.mapName}</span>
                        <span className={styles.habitatNote}>
                          {[
                            h.zones !== null && h.zones > 0 && `${h.totalZones}くかく中 ${h.zones}くかく`,
                            h.count > 0 && `5ひき中 ${h.count}`,
                            h.fixed && 'かならず でる ばしょ あり',
                          ]
                            .filter(Boolean)
                            .join('・')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.none}>ふつうには でてこない（イベントで あう）</p>
              )}
            </section>

            <button
              type="button"
              data-variant="primary"
              className={styles.battle}
              onClick={() => {
                storeLastMonster(monster.id)
                navigate('/battle')
              }}
            >
              <Swords size={15} />
              この モンスターと たたかう
            </button>
          </div>
        </div>
      </Window>
    </dialog>
  )
}
