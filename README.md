# Urban Nomad 🌍

> **Live Local, Explore Everywhere**

A React PWA with a FastAPI backend for discovering local city events and getting AI-powered cultural intelligence for any city on Earth.

---

## What It Does

Urban Nomad has two modes:

### 📍 Local Mode
Search any city or zip code and get live event listings pulled from **Ticketmaster** and **Eventbrite** — concerts, festivals, sports, comedy, arts, and more. Filter by category and click through to buy tickets.

### ✈️ Nomad Mode
Planning a trip or just curious about a city? Get three things in one search:
- **The Local Playbook** — AI-generated cultural guide covering the city's vibe, etiquette, neighborhoods, food, and transport tips
- **Events** — same live event listings as Local mode
- **Community Tips** — insider tips posted by other nomads, filterable by category (Food, Transport, Safety, Etiquette, Nightlife, Hidden Gems)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router, CSS Modules |
| PWA | Web App Manifest, Service Worker |
| Backend | FastAPI, Python 3.11+, async SQLAlchemy |
| Database | SQLite (via aiosqlite) |
| Events API | Ticketmaster Discovery v2, Eventbrite v3 |
| AI | OpenAI GPT-4o-mini |
| Deploy | Render.com (static site + Python web service) |

---

## Project Structure

```
urban-nomad/
├── frontend/                  # React PWA
│   ├── public/
│   │   ├── logo.jpeg          # App logo
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service worker
│   │   └── icons/             # PWA icons (192, 512)
│   └── src/
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── LocationSearch.jsx   # City + State / Zip toggle
│       │   ├── EventCard.jsx
│       │   ├── TipCard.jsx
│       │   └── Logo.jsx
│       ├── pages/
│       │   ├── Home.jsx       # Mode selector
│       │   ├── LocalMode.jsx
│       │   └── NomadMode.jsx
│       └── services/
│           └── api.js         # All backend fetch calls
│
├── backend/                   # FastAPI
│   └── app/
│       ├── main.py            # App entry, CORS, lifespan
│       ├── database.py        # Async SQLAlchemy setup
│       ├── models.py          # LocalTip table
│       ├── routers/
│       │   ├── events.py      # GET /api/events
│       │   └── nomad.py       # GET /api/nomad/briefing, tips CRUD
│       └── services/
│           ├── ticketmaster.py
│           ├── eventbrite.py
│           └── openai_service.py
│
├── render.yaml                # Render.com deploy config
└── .gitignore
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- API keys for Ticketmaster, Eventbrite, and OpenAI

### 1. Clone the repo

```bash
git clone https://github.com/timothytroyhollis-ctrl/urban-nomad.git
cd urban-nomad
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your keys:

```
TICKETMASTER_API_KEY=your_key_here
EVENTBRITE_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here
```

> ⚠️ **Never commit `.env`** — it is gitignored. Only `.env.example` belongs in the repo.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/events` | Search events by city, state, or zip |
| GET | `/api/nomad/briefing` | AI cultural playbook for a city |
| GET | `/api/nomad/tips` | Community tips for a city |
| POST | `/api/nomad/tips` | Submit a new community tip |

---

## Deploying to Render.com

The `render.yaml` in the root configures both services automatically.

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your `urban-nomad` repo
4. Add your API keys as environment variables in the Render dashboard
5. Deploy

---

## No Auth in v1

Urban Nomad v1 is intentionally auth-free — no accounts, no logins. Community tips are posted anonymously or with a self-chosen handle.

---

## License

MIT
