# The Golden Age Archive 📻

A comprehensive music streaming platform dedicated to preserving and exploring music from the
**1930s, 1940s, and 1950s** — with historical context, curated "mixtapes," a persistent
radio-dashboard audio player (with optional vinyl crackle), and a slightly vintage,
mid-century-modern UI.

## Tech Stack

| Layer | Choice |
|---|---|
| Database | MongoDB (Mongoose ODM) |
| Backend | Node.js + Express.js (REST under `/api/v1`) |
| Frontend | React 18 (Vite), Hooks + Context API |
| Styling | Tailwind CSS + custom vintage CSS (grain overlay, sepia, ring-wear sleeves) |
| Audio | HTML5 Audio via React PlayerContext + Web Audio API vinyl-crackle toggle |
| Auth | JWT + bcryptjs |

## Quick Start

```bash
# 1. Install backend deps
npm install

# 2. Configure environment
cp .env.example .env        # set MONGODB_URI + JWT_SECRET

# 3. Seed the archive (artists, tracks, curated decade playlists, admin user)
npm run seed

# 4. Run the API (http://localhost:5000)
npm run dev

# 5. Run the frontend (http://localhost:5173, proxied to the API)
cd client && npm install && npm run dev
```

### Testing without a local MongoDB

```bash
npm run smoke   # boots mongodb-memory-server + the full Express app, runs 25 API assertions
```

### Demo accounts

- **Admin:** `admin@goldenage-archive.com` / `archive1930` (created by `npm run seed`; required for `POST /api/v1/tracks`)

## Project Layout

```
├── server.js                 # Express entrypoint (also exports app for tests)
├── server/
│   ├── config/db.js          # Mongoose connection
│   ├── models/               # User, Artist, Track, Playlist
│   ├── controllers/          # auth, tracks, artists, playlists, users
│   ├── middleware/auth.js    # protect (JWT) + admin guards
│   └── routes/               # mounted at /api/v1/*
├── scripts/
│   ├── seed.js               # idempotent seed data (npm run seed)
│   └── smoke-test.js         # in-memory API smoke test (npm run smoke)
└── client/                   # Vite + React SPA
    ├── src/components/       # AudioPlayer, Navbar, TimeMachine, TrackCard
    ├── src/context/          # AuthContext, PlayerContext (global playback state)
    ├── src/pages/            # Home, Artists, ArtistDetail, Playlists, Login/Register, Profile
    ├── render.yaml / vercel.json  → deployment configs (see below)
```

## API Overview (`/api/v1`)

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`
- `GET /tracks?decade=1930s&genre=Swing&year=1937&sort=popular&search=…` · `GET /tracks/:id` · `POST /tracks` *(admin)*
- `GET /artists` · `GET /artists/:id` (with discography) · `POST/PUT/DELETE` *(admin)*
- `GET /playlists` · `POST /playlists` · `PUT /playlists/:id/add|remove` · `GET /playlists/user/me`
- `GET /users/profile` · `POST /users/favorites` (toggle) · `POST /users/follow/:artistId` (toggle)

## Deployment (Phase 6)

- **Backend → Render:** push this repo, import `render.yaml` (Blueprint). Set `MONGODB_URI`
  to your Atlas connection string; `JWT_SECRET` is auto-generated. Health check: `/api/health`.
  A `Procfile` is included for Heroku-style hosts.
- **Database → MongoDB Atlas:** free M0 cluster works; create a DB user and allow your host's CIDR.
- **Frontend → Vercel (or Netlify):** import `client/` as root, build `npm run build`, output `dist`.
  `client/vercel.json` adds SPA rewrites + asset caching. Set the API URL via the Vite proxy in dev;
  in production either deploy both on the same domain or point `VITE_API_URL` at the Render service.
- **Media storage:** track `audioUrl`s are plain URLs — host files on S3/Cloudinary and paste the
  public URLs when seeding or uploading via `POST /api/v1/tracks`.

## Design System

Palette: parchment `#F4ECE6` / kraft `#E8D8C8`, ink `#2C2A29`, oxblood `#8B3A3A`, gold `#D4AF37`,
player chassis `#1A1A1A`. Type: Playfair Display (headings), Lora (body), Courier Prime (typewriter
metadata). Effects: fixed film-grain overlay, sepia/vignette imagery, record-sleeve cards with ring wear.
