import Header from '../components/Header'
import styles from './Mode.module.css'

export default function NomadMode() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.comingSoon}>
          <span className={styles.icon}>✈️</span>
          <h2>Nomad Mode</h2>
          <p>AI cultural briefings &amp; community tips — coming next.</p>
        </div>
      </main>
    </div>
  )
}
