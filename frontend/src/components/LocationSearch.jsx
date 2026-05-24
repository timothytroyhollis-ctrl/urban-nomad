import { useState, useRef, useEffect } from 'react'
import { detectLocation, geoErrorMessage } from '../hooks/useGeolocation'
import { useRecentSearches } from '../hooks/useRecentSearches'
import styles from './LocationSearch.module.css'

export default function LocationSearch({ onSearch, loading, accentColor = 'green', buttonLabel = 'Search' }) {
  const [mode, setMode] = useState('city')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [showRecent, setShowRecent] = useState(false)
  const { recent, remove } = useRecentSearches()
  const wrapRef = useRef(null)

  const accent = accentColor === 'amber' ? styles.amber : styles.green

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowRecent(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const triggerSearch = (loc) => {
    setShowRecent(false)
    onSearch(loc)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'zip') {
      if (!zip.trim()) return
      triggerSearch({ zip_code: zip.trim(), displayName: zip.trim() })
    } else {
      if (!city.trim()) return
      const displayName = state.trim() ? `${city.trim()}, ${state.trim()}` : city.trim()
      triggerSearch({ city: city.trim(), state: state.trim() || undefined, displayName })
    }
  }

  const handleDetectLocation = async () => {
    setGeoError('')
    setDetecting(true)
    try {
      const loc = await detectLocation()
      setMode('city')
      setCity(loc.city)
      setState(loc.state || '')
      setZip('')
      triggerSearch({
        city: loc.city,
        state: loc.state || undefined,
        displayName: loc.displayName,
      })
    } catch (err) {
      setGeoError(geoErrorMessage(err))
    } finally {
      setDetecting(false)
    }
  }

  const handlePickRecent = (r) => {
    if (r.zip_code) {
      setMode('zip')
      setZip(r.zip_code)
      setCity('')
      setState('')
    } else {
      setMode('city')
      setCity(r.city || '')
      setState(r.state || '')
      setZip('')
    }
    triggerSearch(r)
  }

  return (
    <form className={styles.wrap} onSubmit={handleSubmit} ref={wrapRef}>
      {/* Mode toggle + detect button */}
      <div className={styles.toggleRow}>
        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'city' ? `${styles.toggleActive} ${accent}` : ''}`}
            onClick={() => setMode('city')}
          >
            🏙️ City
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'zip' ? `${styles.toggleActive} ${accent}` : ''}`}
            onClick={() => setMode('zip')}
          >
            📮 Zip / Postal
          </button>
        </div>
        <button
          type="button"
          className={styles.locateBtn}
          onClick={handleDetectLocation}
          disabled={detecting || loading}
          title="Use my current location"
        >
          {detecting
            ? <><span className={styles.miniSpinner} /> Locating…</>
            : <>📍 Use my location</>
          }
        </button>
      </div>

      {/* Inputs (with recent dropdown anchored here) */}
      <div className={styles.inputZone}>
        {mode === 'city' ? (
          <div className={styles.cityRow}>
            <input
              className={styles.input}
              type="text"
              placeholder="City name — e.g. Jacksonville"
              value={city}
              onChange={e => { setCity(e.target.value); if (e.target.value) setShowRecent(false) }}
              onFocus={() => recent.length > 0 && !city && setShowRecent(true)}
            />
            <input
              className={`${styles.input} ${styles.stateInput}`}
              type="text"
              placeholder="State / Country"
              value={state}
              onChange={e => setState(e.target.value)}
              onFocus={() => setShowRecent(false)}
            />
          </div>
        ) : (
          <input
            className={styles.input}
            type="text"
            placeholder="ZIP or postal code — e.g. 32099"
            value={zip}
            onChange={e => { setZip(e.target.value); if (e.target.value) setShowRecent(false) }}
            onFocus={() => recent.length > 0 && !zip && setShowRecent(true)}
          />
        )}

        {showRecent && recent.length > 0 && (
          <div className={styles.recentDropdown}>
            <div className={styles.recentHeader}>Recent searches</div>
            {recent.map((r, i) => (
              <div key={`${r.displayName}-${i}`} className={styles.recentRow}>
                <button
                  type="button"
                  className={styles.recentItem}
                  onClick={() => handlePickRecent(r)}
                >
                  <span className={styles.recentIcon}>{r.zip_code ? '📮' : '🏙️'}</span>
                  <span className={styles.recentName}>{r.displayName}</span>
                </button>
                <button
                  type="button"
                  className={styles.recentRemove}
                  aria-label={`Remove ${r.displayName} from recents`}
                  onClick={(e) => { e.stopPropagation(); remove(r.displayName) }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className={`${styles.searchBtn} ${accent}`}
        type="submit"
        disabled={loading || detecting || (mode === 'city' ? !city.trim() : !zip.trim())}
      >
        {loading ? <span className={styles.spinner} /> : buttonLabel}
      </button>

      {geoError && (
        <p className={styles.geoError}>⚠️ {geoError}</p>
      )}
    </form>
  )
}
