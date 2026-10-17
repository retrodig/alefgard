import { useState } from 'react'
import { useNavigate } from 'react-router'
import { DEFAULT_SAVE, encodePassword } from '../../features/jumon/password'
import { loadStoredPassword, storePassword } from '../../features/jumon/storage'
import { useDamdara } from '../../wasm/useDamdara'
import { SaveSlots } from './SaveSlots'
import styles from './Settings.module.css'

export function SettingsPage() {
  const { getMasterData } = useDamdara()
  const navigate = useNavigate()
  // じゅもんページで自動保存されている「いまの じょうたい」
  const [password] = useState(() => loadStoredPassword() ?? encodePassword(DEFAULT_SAVE))

  const load = (value: string) => {
    storePassword(value)
    navigate(`/jumon?p=${encodeURIComponent(value)}`)
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>せってい</h1>
        <p className={styles.pageDescription}>セーブスロットの かんり</p>
      </header>
      <div className={styles.content}>
        <SaveSlots password={password} statusTable={getMasterData().statusTable} onLoad={load} />
      </div>
    </>
  )
}
