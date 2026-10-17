import { Link } from 'react-router'
import { ArrowRight, Database, Map, ScrollText, Swords, type LucideIcon } from 'lucide-react'
import { useDamdara } from '../wasm/useDamdara'
import styles from './Home.module.css'

const SECTIONS: { to: string; title: string; text: string; icon: LucideIcon; ready: boolean }[] = [
  {
    to: '/jumon',
    title: 'ふっかつのじゅもん',
    text: 'じゅもんから つよさを しらべる・パラメータから じゅもんを つくる',
    icon: ScrollText,
    ready: true,
  },
  { to: '/battle', title: 'せんとうシミュレータ', text: 'モンスターと 1 ターンずつ たたかう', icon: Swords, ready: true },
  { to: '/world', title: 'アレフガルドのせかい', text: 'ちずから まち・しろ に はいり、ひとと はなす', icon: Map, ready: true },
  { to: '/data', title: 'データ', text: 'モンスター・そうび・じゅもん・レベル表', icon: Database, ready: true },
]

export function Home() {
  const { getMasterData } = useDamdara()
  const { monsters, weapons, armors, shields, items, spells } = getMasterData()
  const stats = [
    { label: 'モンスター', value: monsters.length },
    { label: 'そうび', value: weapons.length + armors.length + shields.length - 3 },
    { label: 'どうぐ', value: items.length - 1 },
    { label: 'じゅもん', value: spells.length },
  ]

  return (
    <>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>ファミコン版『ドラゴンクエスト』非公式攻略</p>
        <h1 className={styles.heroTitle}>アレフガルド</h1>
        <p className={styles.heroText}>ふっかつのじゅもんの解析・作成、モンスターやそうびのデータをまとめています。</p>
        <dl className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={styles.cards}>
        {SECTIONS.map(({ to, title, text, icon: Icon, ready }) => (
          <Link key={to} to={to} className={styles.card}>
            <span className={styles.cardIcon}>
              <Icon size={20} />
            </span>
            <span className={styles.cardTitle}>
              {title}
              {!ready && <span className={styles.badge}>じゅんびちゅう</span>}
            </span>
            <span className={styles.cardText}>{text}</span>
            <span className={styles.cardLink}>
              ひらく <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
