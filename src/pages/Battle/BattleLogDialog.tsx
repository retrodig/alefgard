import { useEffect, useRef } from 'react'
import { Trash2, X } from 'lucide-react'
import { ConfirmButton } from '../../components/ConfirmButton'
import { Window } from '../../components/Window'
import { HISTORY_MAX, OUTCOME_LABEL, type BattleLogLine, type BattleRecord } from '../../features/battle/history'
import styles from './BattleLogDialog.module.css'

interface Props {
  /** 新しい順の きろく */
  history: BattleRecord[]
  /** たたかっている とちゅうの せんとう（あれば いちばん上に出す） */
  current: { hero: string; monster: string; log: BattleLogLine[] } | null
  onClear: () => void
  onClose: () => void
}

const timeFormat = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** ターンの区切りを入れて メッセージを並べる */
function LogLines({ log }: { log: BattleLogLine[] }) {
  return (
    <div className={styles.lines}>
      {log.map((line, i) => {
        const newTurn = i > 0 && log[i - 1].turn !== line.turn
        return (
          <p key={i} className={newTurn ? styles.turnStart : undefined}>
            {line.text || ' '}
          </p>
        )
      })}
    </div>
  )
}

/** せんとうの きろく：これまでの せんとうの メッセージを 読みかえす */
export function BattleLogDialog({ history, current, onClear, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    // 「けす」に フォーカスが 当たらないよう、とじる ボタンに あわせる
    closeRef.current?.focus()
  }, [])

  const close = () => dialogRef.current?.close()

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="せんとうの きろく"
      onClose={onClose}
      // 画面の外（背景）をクリックしたら閉じる
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <Window
        title="せんとうの きろく"
        className={styles.window}
        actions={
          <>
            <span className={styles.count}>
              {history.length}けん（あたらしい {HISTORY_MAX}けんまで ほぞん）
            </span>
            <ConfirmButton
              variant="ghost"
              confirmLabel="ぜんぶ けす？"
              disabled={history.length === 0}
              onConfirm={onClear}
            >
              <Trash2 size={14} />
              けす
            </ConfirmButton>
            <button ref={closeRef} type="button" data-variant="ghost" aria-label="とじる" onClick={close}>
              <X size={16} />
            </button>
          </>
        }
      >
        <div className={styles.list}>
          {current && (
            <details className={styles.record} open>
              <summary>
                <span className={styles.badge} data-outcome="current">
                  せんとうちゅう
                </span>
                <span className={styles.monster}>{current.monster}</span>
                <span className={styles.meta}>{current.hero}</span>
              </summary>
              <LogLines log={current.log} />
            </details>
          )}
          {history.map((record, i) => (
            <details key={record.id} className={styles.record} open={!current && i === 0}>
              <summary>
                <span className={styles.badge} data-outcome={record.outcome}>
                  {OUTCOME_LABEL[record.outcome]}
                </span>
                <span className={styles.monster}>{record.monster}</span>
                <span className={styles.meta}>
                  {record.hero}・{record.turns}ターン・{timeFormat.format(new Date(record.at))}
                </span>
              </summary>
              <LogLines log={record.log} />
            </details>
          ))}
          {!current && history.length === 0 && <p className={styles.empty}>まだ きろくが ありません。</p>}
        </div>
      </Window>
    </dialog>
  )
}
