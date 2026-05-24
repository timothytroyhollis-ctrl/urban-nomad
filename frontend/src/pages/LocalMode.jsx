import { useState, useCallback } from 'react'
import Header from '../components/Header'
import EventCard from '../components/EventCard'
import LocationSearch from '../components/LocationSearch'
import DateFilter from '../components/DateFilter'
import CalendarView from '../components/CalendarView'
import Footer from '../components/Footer'
import { getEvents } from '../services/api'
import { useRecentSearches } from '../hooks/useRecentSearches'
import styles from './LocalMode.module.css'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: '🎵 Music', value: 'Music' },
  { label: '⚽ Sports', value: 'Sports' },
  { label: '🎭 Arts', value: 'Arts & Theatre' },
  { label: '😂 Comedy', value: 'Comedy' },
  { label: '👨‍👩‍👧 Family', value: 'Family' },
]

export default function LocalMode() {
  const [category, setCategory] = useState('')
  const [dateRange, setDateRange] = useState({ preset: 'any', start_date: undefined, end_date: undefined })
  const [view, setView] = useState('grid')
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [lastSearch, setLastSearch] = useState(null)
  const { record } = useRecentSearches()

  const runSearch = useCallback(async (searchParams, label, cat, range) => {
    setStatus('loading')
    setErrorMsg('')
    setDisplayName(label)
    setLastSearch(searchParams)
    try {
      const data = await getEvents({
        ...searchParams,
        category: cat,
        start_date: range.start_date,
        end_date: range.end_date,
        size: 24,
      })
      setEvents(data.events || [])
      setStatus('success')
      record({ ...searchParams, displayName: label })
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
    }
  }, [record])

  const search = useCallback(({ city, state, zip_code, displayName: name } = {}) => {
    const isNewSearch = city !== undefined || zip_code !== undefined
    const searchParams = isNewSearch ? { city, state, zip_code } : lastSearch
    if (!searchParams) return
    const label = name || displayName
    runSearch(searchParams, label, category, dateRange)
  }, [lastSearch, displayName, category, dateRange, runSearch])

  const handleCategoryChange = (val) => {
    setCategory(val)
    if (lastSearch) runSearch(lastSearch, displayName, val, dateRange)
  }

  const handleDateChange = (range) => {
    setDateRange(range)
    if (lastSearch) runSearch(lastSearch, displayName, category, range)
  }

  // Hide map background once user has loaded or is loading results
  const isActive = status !== 'idle'

  return (
    <div className={`${styles.page} ${isActive ? styles.pageActive : ''}`}>
      <Header />
      <main className={styles.main}>

        <section className={styles.searchSection}>
          <h1 className={styles.heading}><span className={styles.pin}>📍</span> Local Events</h1>
          <p className={styles.sub}>Find concerts, festivals, sports & more — search by city or zip code</p>
          <LocationSearch onSearch={search} loading={status === 'loading'} accentColor="green" buttonLabel="Search" />
          <div className={styles.filters}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                className={`${styles.filterPill} ${category === c.value ? styles.filterActive : ''}`}
                onClick={() => handleCategoryChange(c.value)}
                type="button"
              >
                {c.label}
              </button>
            ))}
          </div>
          <DateFilter value={dateRange} onChange={handleDateChange} accentColor="green" />
        </section>

        {status === 'loading' && (
          <div className={styles.stateBox}>
            <div className={styles.bigSpinner} />
            <p>Searching events in {displayName}…</p>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.stateBox}>
            <span className={styles.stateIcon}>⚠️</span>
            <p className={styles.stateTitle}>Couldn't load events</p>
            <p className={styles.stateSub}>{errorMsg}</p>
            <button className={styles.retryBtn} onClick={() => search()}>Try again</button>
          </div>
        )}

        {status === 'success' && events.length === 0 && (
          <div className={styles.stateBox}>
            <span className={styles.stateIcon}>🔍</span>
            <p className={styles.stateTitle}>No events found</p>
            <p className={styles.stateSub}>Try a different city, zip code, category, or date range.</p>
          </div>
        )}

        {status === 'success' && events.length > 0 && (
          <section className={styles.results}>
            <div className={styles.resultsBar}>
              <p className={styles.resultsMeta}>
                {events.length} event{events.length !== 1 ? 's' : ''} in <strong>{displayName}</strong>
                {category && ` · ${category}`}
              </p>
              <div className={styles.viewToggle}>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${view === 'grid' ? styles.viewActive : ''}`}
                  onClick={() => setView('grid')}
                >
                  ▦ Grid
                </button>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${view === 'calendar' ? styles.viewActive : ''}`}
                  onClick={() => setView('calendar')}
                >
                  🗓️ Calendar
                </button>
              </div>
            </div>

            {view === 'grid' ? (
              <div className={styles.grid}>
                {events.map(event => <EventCard key={event.id} event={event} />)}
              </div>
            ) : (
              <CalendarView events={events} accentColor="green" />
            )}
          </section>
        )}

        {status === 'idle' && (
          <div className={styles.idleHint}>
            <span className={styles.idleIcon}>🌆</span>
            <p>Search any city or zip code to see what's happening</p>
          </div>
        )}

        <Footer />
      </main>
    </div>
  )
}
