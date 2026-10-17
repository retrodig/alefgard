import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { CommandOption } from '../../features/battle/commands'
import type { BattleAction } from '../../wasm/types'
import styles from './Battle.module.css'

interface Props {
  spells: CommandOption[]
  items: CommandOption[]
  /** ゆうしゃが ねむっていて 行動できない */
  asleep: boolean
  /** メッセージ表示中などで 操作できない */
  disabled: boolean
  onCommand: (action: BattleAction, selection?: number) => void
}

type Menu = 'main' | 'spell' | 'item'

/** たたかう・じゅもん・どうぐ・にげる のコマンド */
export function CommandWindow({ spells, items, asleep, disabled, onCommand }: Props) {
  const [menu, setMenu] = useState<Menu>('main')

  const run = (action: BattleAction, selection?: number) => {
    setMenu('main')
    onCommand(action, selection)
  }

  if (asleep) {
    return (
      <div className={styles.commands}>
        <button type="button" className={styles.command} disabled={disabled} onClick={() => run('attack')}>
          ねむっている…（つぎへ）
        </button>
      </div>
    )
  }

  if (menu !== 'main') {
    const options = menu === 'spell' ? spells : items
    const action: BattleAction = menu
    return (
      <div className={styles.subMenu}>
        <ul className={styles.optionList}>
          {options.map((o) => (
            <li key={o.selection}>
              <button
                type="button"
                className={styles.option}
                disabled={disabled || o.disabled}
                title={o.reason}
                onClick={() => run(action, o.selection)}
              >
                <span>{o.label}</span>
                <span className={styles.optionDetail}>{o.reason ?? o.detail}</span>
              </button>
            </li>
          ))}
          {options.length === 0 && (
            <li className={styles.empty}>{menu === 'spell' ? 'じゅもんを おぼえていない' : 'どうぐを もっていない'}</li>
          )}
        </ul>
        <button type="button" data-variant="ghost" onClick={() => setMenu('main')}>
          <ChevronLeft size={15} />
          もどる
        </button>
      </div>
    )
  }

  return (
    <div className={styles.commands}>
      <button type="button" className={styles.command} disabled={disabled} onClick={() => run('attack')}>
        たたかう
      </button>
      <button type="button" className={styles.command} disabled={disabled} onClick={() => setMenu('spell')}>
        じゅもん
      </button>
      <button type="button" className={styles.command} disabled={disabled} onClick={() => setMenu('item')}>
        どうぐ
      </button>
      <button type="button" className={styles.command} disabled={disabled} onClick={() => run('escape')}>
        にげる
      </button>
    </div>
  )
}
