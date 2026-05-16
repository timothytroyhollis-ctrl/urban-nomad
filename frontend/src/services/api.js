const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

// Local mode
export const getEvents = (city, params = {}) =>
  request(`/events?city=${encodeURIComponent(city)}&${new URLSearchParams(params)}`)

// Nomad mode
export const getBriefing = (city) =>
  request(`/nomad/briefing?city=${encodeURIComponent(city)}`)

export const getTips = (city) =>
  request(`/nomad/tips?city=${encodeURIComponent(city)}`)

export const addTip = (tip) =>
  request('/nomad/tips', { method: 'POST', body: JSON.stringify(tip) })
