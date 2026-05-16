import Header from '../components/Header'
import styles from './Mode.module.css'

export default function LocalMode() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.comingSoon}>
          <span className={styles.icon}>📍</span>
          <h2>Local Mode</h2>
          <p>City event listings via Ticketmaster &amp; Eventbrite — coming next.</p>
        </div>
      </main>
    </div>
  )
}
