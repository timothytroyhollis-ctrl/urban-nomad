import { useState, useMemo, useEffect } from 'react'
import styles from './CalendarView.module.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildGrid(viewDate) {
  // Build 6 weeks × 7 days starting from the Sunday of the first week
  const first = startOfMonth(viewDate)
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - first.getDay()) // back to Sunday
  const cells = []
  const d = new Date(gridStart)
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return cells
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SOURCE_COLOR = { ticketmaster: '#026CDF', eventbrite: '#F05537' }

export default function CalendarView({ events, accentColor = 'green' }) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Default view = the month of the first upcoming event (or today)
  const [viewDate, setViewDate] = useState(() => {
    const first = events.find(e => e.start_date)
    if (first) {
      const [y, m] = first.start_date.split('-')
      return new Date(parseInt(y), parseInt(m) - 1, 1)
    }
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // When the events list changes (e.g. a new date filter), jump to the month
  // of the first event in the new result set. Keeps the calendar in sync with
  // whatever the user just filtered to.
  useEffect(() => {
    const first = events.find(e => e.start_date)
    if (!first) return
    const [y, m] = first.start_date.split('-')
    const target = new Date(parseInt(y), parseInt(m) - 1, 1)
    setViewDate(prev =>
      prev.getFullYear() === target.getFullYear() && prev.getMonth() === target.getMonth()
        ? prev
        : target
    )
  }, [events])

  const eventsByDate = useMemo(() => {
    const map = new Map()
    for (const ev of events) {
      if (!ev.start_date) continue
      if (!map.has(ev.start_date)) map.set(ev.start_date, [])
      map.get(ev.start_date).push(ev)
    }
    return map
  }, [events])

  const cells = useMemo(() => buildGrid(viewDate), [viewDate])

  const goPrev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const goNext = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))

  const accent = accentColor === 'amber' ? styles.amber : styles.green

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </div>
        <div className={styles.controls}>
          <button type="button" className={styles.navBtn} onClick={goPrev} aria-label="Previous month">‹</button>
          <button type="button" className={`${styles.todayBtn} ${accent}`} onClick={goToday}>Today</button>
          <button type="button" className={styles.navBtn} onClick={goNext} aria-label="Next month">›</button>
        </div>
      </div>

      <div className={styles.dowRow}>
        {DOW.map(d => <div key={d} className={styles.dowCell}>{d}</div>)}
      </div>

      <div className={styles.grid}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === viewDate.getMonth()
          const isToday = isSameDay(d, today)
          const dayEvents = eventsByDate.get(dateKey(d)) || []
          return (
            <div
              key={i}
              className={`${styles.cell} ${inMonth ? '' : styles.outside} ${isToday ? `${styles.today} ${accent}` : ''}`}
            >
              <div className={styles.dateBadge}>
                <span className={styles.dateNum}>{d.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className={styles.eventCount}>{dayEvents.length}</span>
                )}
              </div>
              <div className={styles.events}>
                {dayEvents.slice(0, 3).map(ev => (
                  <a
                    key={ev.id}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.event}
                    title={`${ev.name}${ev.venue_name ? ` · ${ev.venue_name}` : ''}`}
                  >
                    <span className={styles.eventDot} style={{ background: SOURCE_COLOR[ev.source] || '#888' }} />
                    <span className={styles.eventName}>{ev.name}</span>
                  </a>
                ))}
                {dayEvents.length > 3 && (
                  <div className={styles.more}>+ {dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
