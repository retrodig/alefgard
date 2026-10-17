import { useId, useState } from 'react'
import { Window } from '../../components/Window'
import { MESSAGE_SPEEDS, type MessageSpeed } from '../../features/battle/reveal'
import { loadMessageSpeed, storeMessageSpeed } from '../../features/battle/storage'
import styles from './Settings.module.css'

/** せんとうメッセージの はやさ（文字送りの速さ） */
export function MessageSpeedSetting() {
  const name = useId()
  const [speed, setSpeed] = useState<MessageSpeed>(loadMessageSpeed)

  const change = (next: MessageSpeed) => {
    setSpeed(next)
    storeMessageSpeed(next)
  }

  return (
    <Window title="メッセージの はやさ">
      <div className={styles.segmented} role="radiogroup" aria-label="メッセージの はやさ">
        {MESSAGE_SPEEDS.map((option) => (
          <label key={option.id} className={styles.segment}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={speed === option.id}
              onChange={() => change(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <p className={styles.hint}>せんとうの メッセージを 1 もじずつ だす はやさ。「ちょうはやい」は 1 ぎょうずつ だします。</p>
    </Window>
  )
}
