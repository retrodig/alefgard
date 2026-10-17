import { NavLink, Outlet } from 'react-router'
import { Ghost, Package, Sword, TrendingUp, WandSparkles, type LucideIcon } from 'lucide-react'
import styles from './Data.module.css'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: 'monsters', label: 'モンスター', icon: Ghost },
  { to: 'equipment', label: 'そうび', icon: Sword },
  { to: 'items', label: 'どうぐ', icon: Package },
  { to: 'spells', label: 'じゅもん', icon: WandSparkles },
  { to: 'levels', label: 'レベル', icon: TrendingUp },
]

export function DataLayout() {
  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>データ</h1>
        <p className={styles.pageDescription}>モンスター・そうび・どうぐ・じゅもん・レベルの一覧。見出しで並べ替えできます。</p>
      </header>
      <nav aria-label="データの種類" className={styles.tabs}>
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
      <p className={styles.source}>
        データ出典：
        <a href="https://github.com/retrodig/damdara" target="_blank" rel="noreferrer">
          damdara
        </a>
      </p>
    </>
  )
}
