import { use } from 'react'
import { createGame, getBattleBackgroundImage, getEnemySpriteImage, getMasterData, initDamdara } from './init'

/**
 * WASM の初期化を待つ（Suspense で待機、失敗時は ErrorBoundary へ）。
 * createGame で各ページ用のゲームインスタンスを作る（不要になったら free する）。
 */
export function useDamdara() {
  use(initDamdara())
  return { createGame, getMasterData, getEnemySpriteImage, getBattleBackgroundImage }
}
