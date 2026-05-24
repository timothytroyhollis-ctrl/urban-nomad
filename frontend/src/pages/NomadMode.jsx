import { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Header from '../components/Header'
import TipCard from '../components/TipCard'
import EventCard from '../components/EventCard'
import LocationSearch from '../components/LocationSearch'
import CalendarView from '../components/CalendarView'
import { getBriefing, getTips, addTip, getEvents } from '../services/api'
import { useRecentSearches } from '../hooks/useRecentSearches'
import { shareContent } from '../utils/share'
import styles from './NomadMode.module.css'

const TIP_CATEGORIES = ['General', 'Food', 'Transport', 'Safety', 'Etiquette', 'Nightlife', 'Hidden Gems']
const INITIAL_FORM = { category: 'General', content: '', author_handle: '' }

export default function NomadMode() {
  const [activeTab, setActiveTab] = useState('playbook')
  const [briefing, setBriefing] = useState('')
  const [tips, setTips] = useState([])
  const [events, setEvents] = useState([])
  const [tipFilter, setTipFilter] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [lastSearch, setLastSearch] = useState(null)
  const [playbookStatus, setPlaybookStatus] = useState('idle')
  const [tipsStatus, setTipsStatus] = useState('idle')
  const [eventsStatus, setEventsStatus] = useState('idle')
  const [form, setForm] = useState(INITIAL_FORM)
  const [formStatus, setFormStatus] = useState('idle')
  const [showForm, setShowForm] = useState(false)
  const [eventsView, setEventsView] = useState('grid')
  const [shareToast, setShareToast] = useState('')
  const { record } = useRecentSearches()

  // Auto-search if ?city=X is in the URL (from a shared link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cityParam = params.get('city')
    if (cityParam) {
      const parts = cityParam.split(',').map(s => s.trim())
      search({
        city: parts[0],
        state: parts[1] || undefined,
        displayName: cityParam,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSharePlaybook = async () => {
    const res = await shareContent({
      title: `${displayName} — Urban Nomad`,
      text: `Local guide for ${displayName}. Get the inside scoop on culture, food, and neighborhoods.`,
      url: `${window.location.origin}/nomad?city=${encodeURIComponent(displayName)}`,
    })
    if (res.method === 'clipboard' && res.ok) {
      setShareToast('Link copied to clipboard!')
      setTimeout(() => setShareToast(''), 1800)
    }
  }

  const search = useCallback(async ({ city, state, zip_code, displayName: name }) => {
    const cityLabel = name || zip_code || city
    setDisplayName(cityLabel)
    setLastSearch({ city, state, zip_code })
    record({ city, state, zip_code, displayName: cityLabel })
    setPlaybookStatus('loading')
    setTipsStatus('loading')
    setEventsStatus('loading')
    setBriefing('')
    setTips([])
    setEvents([])

    // Use the human-readable name for briefing/tips lookups
    const locationLabel = name || city || zip_code

    const [playbookResult, tipsResult, eventsResult] = await Promise.allSettled([
      getBriefing(locationLabel),
      getTips(locationLabel),
      getEvents({ city, state, zip_code, size: 24 }),
    ])

    if (playbookResult.status === 'fulfilled') {
      setBriefing(playbookResult.value.briefing)
      setPlaybookStatus('success')
    } else {
      setPlaybookStatus('error')
    }

    if (tipsResult.status === 'fulfilled') {
      setTips(tipsResult.value.tips || [])
      setTipsStatus('success')
    } else {
      setTipsStatus('error')
    }

    if (eventsResult.status === 'fulfilled') {
      setEvents(eventsResult.value.events || [])
      setEventsStatus('success')
    } else {
      setEventsStatus('error')
    }
  }, [record])

  const [formError, setFormError] = useState('')

  const submitTip = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) return
    setFormStatus('loading')
    setFormError('')
    try {
      await addTip({ ...form, city: displayName, category: form.category.toLowerCase() })
      const data = await getTips(displayName)
      setTips(data.tips || [])
      setForm(INITIAL_FORM)
      setShowForm(false)
      setFormStatus('idle')
    } catch (err) {
      // Detect moderation rejection vs generic error
      const msg = err?.message || ''
      if (msg.toLowerCase().includes("community standards")) {
        setFormError(msg)
      } else {
        setFormError('Failed to post — try again.')
      }
      setFormStatus('error')
    }
  }

  const filteredTips = tipFilter
    ? tips.filter(t => t.category?.toLowerCase() === tipFilter.toLowerCase())
    : tips

  const hasResults = playbookStatus === 'success' || tipsStatus === 'success' || eventsStatus === 'success'
  const isLoading = playbookStatus === 'loading'

  // Hide map background once anything has loaded or is loading
  const isActive = hasResults || isLoading

  return (
    <div className={`${styles.page} ${isActive ? styles.pageActive : ''}`}>
      <Header />
      <main className={styles.main}>

        <section className={styles.searchSection}>
          <h1 className={styles.heading}><span>✈️</span> Nomad Mode</h1>
          <p className={styles.sub}>Your local guide + events + insider tips for any city on Earth</p>
          <LocationSearch
            onSearch={search}
            loading={isLoading}
            accentColor="amber"
            buttonLabel="Explore"
          />
        </section>

        {hasResults && (
          <section className={styles.content}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'playbook' ? styles.tabActive : ''}`} onClick={() => setActiveTab('playbook')}>
                📖 <span className={styles.tabFull}>The Local </span>Playbook
              </button>
              <button className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`} onClick={() => setActiveTab('events')}>
                🎟️ Events
                {events.length > 0 && <span className={styles.badge}>{events.length}</span>}
              </button>
              <button className={`${styles.tab} ${activeTab === 'tips' ? styles.tabActive : ''}`} onClick={() => setActiveTab('tips')}>
                💬 <span className={styles.tabFull}>Community </span>Tips
                {tips.length > 0 && <span className={styles.badge}>{tips.length}</span>}
              </button>
            </div>

            {/* Playbook tab */}
            {activeTab === 'playbook' && (
              <div className={styles.briefingWrap}>
                {playbookStatus === 'loading' && (
                  <div className={styles.stateBox}>
                    <div className={styles.globeSpinner}>🌍</div>
                    <p>Building your local guide for {displayName}…</p>
                    <p className={styles.stateSub}>This takes 5–10 seconds</p>
                  </div>
                )}
                {playbookStatus === 'error' && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>⚠️</span>
                    <p>Couldn't generate your guide — check your OpenAI key.</p>
                  </div>
                )}
                {playbookStatus === 'success' && (
                  <div className={styles.briefing}>
                    <div className={styles.briefingHeader}>
                      <h2 className={styles.cityTitle}>{displayName}</h2>
                      <div className={styles.briefingActions}>
                        <span className={styles.aiTag}>✨ AI Generated</span>
                        <button
                          type="button"
                          className={styles.shareBtn}
                          onClick={handleSharePlaybook}
                          aria-label="Share this playbook"
                          title="Share this playbook"
                        >
                          ↗ Share
                        </button>
                      </div>
                    </div>
                    <div className={styles.markdown}>
                      <ReactMarkdown>{briefing}</ReactMarkdown>
                    </div>
                    {shareToast && <div className={styles.shareToast}>{shareToast}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Events tab */}
            {activeTab === 'events' && (
              <div className={styles.eventsWrap}>
                {eventsStatus === 'loading' && (
                  <div className={styles.stateBox}>
                    <div className={styles.bigSpinner} />
                    <p>Finding events in {displayName}…</p>
                  </div>
                )}
                {eventsStatus === 'error' && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>⚠️</span>
                    <p>Couldn't load events for {displayName}.</p>
                  </div>
                )}
                {eventsStatus === 'success' && events.length === 0 && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>🎟️</span>
                    <p className={styles.stateTitle}>No upcoming events found</p>
                    <p className={styles.stateSub}>Try a different city or check back closer to your travel dates.</p>
                  </div>
                )}
                {eventsStatus === 'success' && events.length > 0 && (
                  <>
                    <div className={styles.eventsBar}>
                      <p className={styles.resultsMeta}>
                        {events.length} upcoming event{events.length !== 1 ? 's' : ''} in <strong>{displayName}</strong>
                      </p>
                      <div className={styles.viewToggle}>
                        <button
                          type="button"
                          className={`${styles.viewBtn} ${eventsView === 'grid' ? styles.viewActive : ''}`}
                          onClick={() => setEventsView('grid')}
                        >▦ Grid</button>
                        <button
                          type="button"
                          className={`${styles.viewBtn} ${eventsView === 'calendar' ? styles.viewActive : ''}`}
                          onClick={() => setEventsView('calendar')}
                        >🗓️ Calendar</button>
                      </div>
                    </div>
                    {eventsView === 'grid' ? (
                      <div className={styles.eventsGrid}>
                        {events.map(event => <EventCard key={event.id} event={event} />)}
                      </div>
                    ) : (
                      <CalendarView events={events} accentColor="amber" />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tips tab */}
            {activeTab === 'tips' && (
              <div className={styles.tipsWrap}>
                <div className={styles.tipsHeader}>
                  <div className={styles.tipFilters}>
                    <button className={`${styles.filterPill} ${tipFilter === '' ? styles.filterActive : ''}`} onClick={() => setTipFilter('')}>All</button>
                    {TIP_CATEGORIES.map(c => (
                      <button key={c} className={`${styles.filterPill} ${tipFilter === c ? styles.filterActive : ''}`} onClick={() => setTipFilter(tipFilter === c ? '' : c)}>{c}</button>
                    ))}
                  </div>
                  <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}>
                    {showForm ? '✕ Cancel' : '+ Add Tip'}
                  </button>
                </div>

                {showForm && (
                  <form className={styles.tipForm} onSubmit={submitTip}>
                    <select className={styles.select} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {TIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea
                      className={styles.textarea}
                      placeholder={`Share an insider tip about ${displayName}…`}
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      rows={3}
                      maxLength={1000}
                      required
                    />
                    <div className={styles.formRow}>
                      <input className={styles.handleInput} placeholder="Your handle (optional)" value={form.author_handle} onChange={e => setForm(f => ({ ...f, author_handle: e.target.value }))} maxLength={60} />
                      <button className={styles.submitBtn} type="submit" disabled={formStatus === 'loading' || !form.content.trim()}>
                        {formStatus === 'loading' ? <span className={styles.spinner} /> : 'Post Tip'}
                      </button>
                    </div>
                    {formStatus === 'error' && <p className={styles.formError}>{formError}</p>}
                  </form>
                )}

                {tipsStatus === 'success' && filteredTips.length === 0 && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>🗺️</span>
                    <p className={styles.stateTitle}>No tips yet for {displayName}</p>
                    <p className={styles.stateSub}>Be the first to share an insider tip!</p>
                  </div>
                )}
                <div className={styles.tipsList}>
                  {filteredTips.map(tip => <TipCard key={tip.id} tip={tip} />)}
                </div>
              </div>
            )}
          </section>
        )}

        {!hasResults && !isLoading && (
          <div className={styles.idleHint}>
            <span className={styles.idleGlobe}>🌍</span>
            <p>Search any city to get the full nomad experience</p>
            <div className={styles.idleExamples}>
              {['Tokyo', 'Buenos Aires', 'Marrakech', 'Tbilisi', 'Medellín'].map(c => (
                <button key={c} className={styles.exampleChip} onClick={() => search({ city: c, displayName: c })}>{c}</button>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
