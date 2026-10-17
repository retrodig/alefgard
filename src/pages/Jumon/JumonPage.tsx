import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Gamepad2, Link2, TriangleAlert } from 'lucide-react'
import { CopyButton } from '../../components/CopyButton'
import { Window } from '../../components/Window'
import { normalizePassword } from '../../features/jumon/kana'
import { decodePassword, DEFAULT_SAVE, encodePassword, type SaveData } from '../../features/jumon/password'
import { useDamdara } from '../../wasm/useDamdara'
import { PasswordForm } from './PasswordForm'
import { RetroDialog } from './RetroDialog'
import { SaveEditor } from './SaveEditor'
import { StatusPanel } from './StatusPanel'
import styles from './Jumon.module.css'

function buildShareUrl(password: string): string {
  return `${location.origin}${location.pathname}#/jumon?p=${encodeURIComponent(password)}`
}

/** URL の p を読み、正しいじゅもんならそのパラメータ、なければ初期値を返す */
function saveFromParam(param: string | null): SaveData {
  const value = normalizePassword(param ?? '').value
  try {
    return decodePassword(value).save
  } catch {
    return DEFAULT_SAVE
  }
}

export function JumonPage() {
  const { createGame, getMasterData } = useDamdara()
  const [searchParams, setSearchParams] = useSearchParams()
  const [retroOpen, setRetroOpen] = useState(false)
  const [notice, setNotice] = useState('')

  // パラメータは同期的に更新できるようローカルに持ち、URL の p には後から書き戻す
  // （URL 更新は非同期のため、直接入力欄の状態にすると速い入力で文字が抜ける）
  const param = searchParams.get('p')
  const [save, setSave] = useState(() => saveFromParam(param))
  const [syncedParam, setSyncedParam] = useState(param)
  const password = encodePassword(save)

  // 戻る・リンクなど外から URL が変わったときは、そちらを読み込む
  if (param !== syncedParam) {
    setSyncedParam(param)
    if (param !== password) setSave(saveFromParam(param))
  }

  useEffect(() => {
    if (searchParams.get('p') !== password) setSearchParams({ p: password }, { replace: true })
  }, [password, searchParams, setSearchParams])

  // ステータス（なまえによる補正込み）は damdara に計算させる
  const player = useMemo(() => {
    const game = createGame()
    try {
      return game.loadFromPassword(password)
    } finally {
      game.free()
    }
  }, [password, createGame])

  const updateSave = (next: SaveData) => {
    setNotice('')
    setSave(next)
  }

  const applyPassword = (input: string) => {
    const { save: decoded, checksumValid } = decodePassword(input)
    setSave(decoded)
    setNotice(
      checksumValid ? '' : 'このじゅもんは チェックサムが あわないため ゲームでは つうじません。ただしい じゅもんに なおしました。',
    )
  }

  return (
    <div className={styles.dashboard}>
      <Window
        title="ふっかつのじゅもん"
        className={styles.areaJumon}
        actions={
          <button type="button" onClick={() => setRetroOpen(true)}>
            <Gamepad2 size={15} />
            とうじの がめんで いれる
          </button>
        }
      >
        <PasswordForm password={password} onApply={applyPassword}>
          <CopyButton text={password} label="じゅもん" />
          <CopyButton text={buildShareUrl(password)} label="URL" icon={<Link2 size={15} />} />
        </PasswordForm>
        {notice && (
          <p className={styles.notice} role="status">
            <TriangleAlert size={16} />
            {notice}
          </p>
        )}
      </Window>

      <div className={styles.areaStatus}>
        <StatusPanel player={player} statusTable={getMasterData().statusTable} />
      </div>
      <div className={styles.areaEditor}>
        <SaveEditor save={save} level={player.summary.level} master={getMasterData()} onChange={updateSave} />
      </div>
      {retroOpen && (
        <RetroDialog password={password} onApply={applyPassword} onClose={() => setRetroOpen(false)} />
      )}
    </div>
  )
}
