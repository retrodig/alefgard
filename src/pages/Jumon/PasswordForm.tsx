import { useId, useState, type ReactNode } from 'react'
import { normalizePassword, PASSWORD_LENGTH } from '../../features/jumon/kana'
import styles from './Jumon.module.css'

interface Props {
  /** 現在のパラメータから作ったじゅもん */
  password: string
  /** 20 文字の正しいじゅもんが入力されたら呼ばれる */
  onApply: (password: string) => void
  /** 文字数の横に並べるボタンなど */
  children?: ReactNode
}

/** コピペで入力するテキストモード。20 文字そろった時点でパラメータに反映する */
export function PasswordForm({ password, onApply, children }: Props) {
  const [draft, setDraft] = useState(password)
  const [prevPassword, setPrevPassword] = useState(password)
  const inputId = useId()

  // パラメータ側の変更で じゅもんが変わったら入力欄も追従させる
  if (password !== prevPassword) {
    setPrevPassword(password)
    if (normalizePassword(draft).value !== password) setDraft(password)
  }

  const normalized = normalizePassword(draft)
  const invalidChars = [...new Set(normalized.chars.filter((c) => !c.valid).map((c) => c.char))]

  const handleChange = (value: string) => {
    setDraft(value)
    const next = normalizePassword(value)
    if (next.complete && next.value !== password) onApply(next.value)
  }

  return (
    <div className={styles.form}>
      <label htmlFor={inputId} className={styles.hint}>
        じゅもんを いれると パラメータに はんえいします。空白・改行・カタカナは自動で整えます。
      </label>
      <textarea
        id={inputId}
        className={styles.passwordInput}
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        rows={2}
        autoComplete="off"
        spellCheck={false}
      />
      <div className={styles.counterRow}>
        <p className={styles.counter} aria-live="polite">
          <span className={normalized.complete ? styles.countComplete : styles.count}>
            {normalized.chars.length} / {PASSWORD_LENGTH}
          </span>
          {invalidChars.length > 0 && <span className={styles.error}>つかえない文字：{invalidChars.join(' ')}</span>}
        </p>
        {children}
      </div>
    </div>
  )
}
