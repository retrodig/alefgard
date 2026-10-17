import { Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  Database,
  House,
  Map,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Swords,
  X,
  type LucideIcon,
} from 'lucide-react'
import logo from '../assets/logo-header.png'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ErrorBoundary } from './ErrorBoundary'
import styles from './Layout.module.css'

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'ホーム', icon: House, end: true },
  { to: '/jumon', label: 'ふっかつのじゅもん', icon: ScrollText },
  { to: '/battle', label: 'せんとう', icon: Swords },
  { to: '/world', label: 'せかい', icon: Map },
  { to: '/data', label: 'データ', icon: Database },
]

const COLLAPSED_KEY = 'alefgard:sidebar-collapsed'
const MOBILE_QUERY = '(max-width: 767px)'

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function saveCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0')
  } catch {
    // 保存できない環境では毎回開いた状態から始める
  }
}

export function Layout() {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  // PC：アイコンだけに畳む / スマホ：ドロワーとして開閉する
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const [prevPath, setPrevPath] = useState(location.pathname)
  const mainRef = useRef<HTMLElement>(null)

  // ページを移動したらドロワーを閉じる
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname)
    setDrawerOpen(false)
  }

  // 本文エリアだけがスクロールするので、ページ移動時は先頭に戻す
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const toggleMenu = () => {
    if (isMobile) {
      setDrawerOpen((open) => !open)
    } else {
      setCollapsed((prev) => {
        saveCollapsed(!prev)
        return !prev
      })
    }
  }

  const menuExpanded = isMobile ? drawerOpen : !collapsed
  const showLabels = isMobile || !collapsed
  const ToggleIcon = isMobile ? (drawerOpen ? X : Menu) : collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <div className={styles.app} data-collapsed={!isMobile && collapsed} data-drawer-open={isMobile && drawerOpen}>
      <header className={styles.topbar}>
        <button
          type="button"
          data-variant="ghost"
          className={styles.menuButton}
          aria-label={menuExpanded ? 'メニューを とじる' : 'メニューを ひらく'}
          aria-expanded={menuExpanded}
          aria-controls="sidebar"
          onClick={toggleMenu}
        >
          <ToggleIcon size={18} />
        </button>
        <NavLink to="/" className={styles.logo} aria-label="アレフガルド ホーム">
          <img src={logo} alt="alefgard" width={146} height={32} />
        </NavLink>
      </header>

      <aside id="sidebar" className={styles.sidebar} aria-label="メニュー" inert={isMobile && !drawerOpen}>
        <nav>
          <ul className={styles.nav}>
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}
                  title={showLabels ? undefined : label}
                  aria-label={showLabels ? undefined : label}
                >
                  <Icon size={18} strokeWidth={1.8} className={styles.navIcon} />
                  {showLabels && <span className={styles.navLabel}>{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {isMobile && drawerOpen && <div className={styles.backdrop} onClick={() => setDrawerOpen(false)} />}

      <div className={styles.content}>
        <main ref={mainRef} className={styles.main}>
          <ErrorBoundary>
            <Suspense fallback={<p className={styles.loading}>よみこみちゅう…</p>}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>

        <footer className={styles.footer}>
          <p>本サイトは非公式のファンサイトです。「ドラゴンクエスト」に関する権利は各権利者に帰属します。</p>
          <p>
            コアロジック:{' '}
            <a href="https://github.com/retrodig/damdara" target="_blank" rel="noreferrer">
              damdara
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
