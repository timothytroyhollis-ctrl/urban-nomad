import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className={styles.header}>
      <button className={styles.brand} onClick={() => navigate('/')} aria-label="Home">
        <img src="/logo.jpeg" alt="" className={styles.headerLogo} />
        <span className={styles.wordmark}>
          <span style={{ color: '#1B2B5E' }}>Urban</span>
          <span style={{ color: '#27AE60' }}>Nomad</span>
        </span>
      </button>
      {!isHome && (
        <nav className={styles.nav}>
          <button
            className={`${styles.pill} ${pathname === '/local' ? styles.active : ''}`}
            onClick={() => navigate('/local')}
          >
            Local
          </button>
          <button
            className={`${styles.pill} ${pathname === '/nomad' ? styles.active : ''}`}
            onClick={() => navigate('/nomad')}
          >
            Nomad
          </button>
        </nav>
      )}
    </header>
  )
}
