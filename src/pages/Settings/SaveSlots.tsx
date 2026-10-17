import { useState } from 'react'
import { FolderOpen, Save, Trash2 } from 'lucide-react'
import { ConfirmButton } from '../../components/ConfirmButton'
import { Window } from '../../components/Window'
import { formatName } from '../../features/jumon/kana'
import { decodePassword } from '../../features/jumon/password'
import { loadSlots, storeSlots, type Slots } from '../../features/jumon/storage'
import type { StatusData } from '../../wasm/types'
import styles from './Settings.module.css'

interface Props {
  /** いまの じょうたい（じゅもんページで自動保存されている状態）のじゅもん */
  password: string
  statusTable: StatusData[]
  onLoad: (password: string) => void
}

const dateFormat = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function levelOf(experience: number, statusTable: StatusData[]): number {
  return statusTable.reduce((lv, s) => (experience >= s.required_exp ? s.level : lv), 1)
}

/** 3 つのセーブスロットへの かきこみ・よみこみ・けす */
export function SaveSlots({ password, statusTable, onLoad }: Props) {
  const [slots, setSlots] = useState<Slots>(loadSlots)

  const update = (index: number, value: Slots[number]) => {
    const next = slots.map((slot, i) => (i === index ? value : slot))
    setSlots(next)
    storeSlots(next)
  }

  const current = decodePassword(password).save

  return (
    <Window title="セーブスロット">
      <p className={styles.current}>
        いまの じょうたい：<strong>{formatName(current.name) || '（なまえなし）'}</strong> Lv{' '}
        {levelOf(current.experience, statusTable)} ・ {current.gold.toLocaleString('ja-JP')}G
      </p>
      <ul className={styles.slots}>
        {slots.map((slot, i) => {
          const save = slot ? decodePassword(slot.password).save : null
          const isCurrent = slot?.password === password
          return (
            <li key={i} className={styles.slot} data-current={isCurrent}>
              <div className={styles.slotInfo}>
                <span className={styles.slotNumber}>{i + 1}</span>
                {save && slot ? (
                  <div className={styles.slotDetail}>
                    <span className={styles.slotName}>
                      {formatName(save.name) || '（なまえなし）'}
                      {isCurrent && <span className={styles.slotBadge}>いまの じょうたい</span>}
                    </span>
                    <span className={styles.slotMeta}>
                      Lv {levelOf(save.experience, statusTable)} ・ {save.gold.toLocaleString('ja-JP')}G ・{' '}
                      {dateFormat.format(new Date(slot.savedAt))}
                    </span>
                  </div>
                ) : (
                  <span className={styles.slotEmpty}>なにも かかれていない</span>
                )}
              </div>
              <div className={styles.slotActions}>
                <ConfirmButton
                  needsConfirm={!!slot && !isCurrent}
                  confirmLabel="うわがき する？"
                  onConfirm={() => update(i, { password, savedAt: new Date().toISOString() })}
                >
                  <Save size={14} />
                  かきこむ
                </ConfirmButton>
                <button type="button" disabled={!slot || isCurrent} onClick={() => slot && onLoad(slot.password)}>
                  <FolderOpen size={14} />
                  よみこむ
                </button>
                <ConfirmButton
                  variant="ghost"
                  disabled={!slot}
                  confirmLabel="けす？"
                  onConfirm={() => update(i, null)}
                >
                  <Trash2 size={14} />
                  <span className={styles.visuallyHidden}>けす</span>
                </ConfirmButton>
              </div>
            </li>
          )
        })}
      </ul>
      <p className={styles.hint}>
        「かきこむ」で いまの じょうたいを スロットに ほぞんします。「よみこむ」と その じょうたいで ふっかつのじゅもん
        ページを ひらきます。いまの じょうたいは ふっかつのじゅもんページで へんしゅうすると じどうで ほぞんされます。
      </p>
    </Window>
  )
}
