# JourneyMan 🏀 — Daily NBA Career Path Puzzle Game

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma%20ORM-indigo.svg)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-ioredis%20Cache-red.svg)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-197%20Passing-brightgreen.svg)](https://vitest.dev/)

**JourneyMan** is a daily NBA timeline puzzle game inspired by Wordle. Each day at **00:00 UTC**, a mystery NBA player is revealed. Your challenge: piece together their chronological franchise-by-franchise career journey in **6 guesses or fewer**.

---

## 🎯 Gameplay & Rules

```
Mystery Player: LeBron James (🔴 Hard — 4 Stints)

Guess 1:  [ MIA ⬛ ] [ CLE 🟨 ] [ CLE 🟨 ] [ LAL 🟩 ]
Guess 2:  [ CLE 🟩 ] [ MIA 🟩 ] [ CLE 🟩 ] [ LAL 🟩 ]  🎉 Solved in 2/6!
```

1. **The Objective**: Place the correct NBA franchise into each career slot in exact chronological order (from draft/rookie stint to most recent).
2. **Career Stints**: A stint is a contiguous period playing for a single franchise (≥ 1 regular-season game). If a player leaves and later returns (e.g. LeBron James on the Cavaliers), it counts as **two separate stints**.
3. **Wordle-Style Graded Feedback**:
   - 🟩 **Green (Correct)**: Correct team in the exact chronological slot.
   - 🟨 **Yellow (Misplaced)**: The player played for this team during their career, but not at this stint order.
   - ⬛ **Gray (Incorrect)**: The player never played for this franchise during their career.
4. **Duplicate-Aware Grading**: If a franchise appears once in the answer, multiple guesses of that team will only color one tile (exact matches prioritized first).
5. **Fixed Guesses & Difficulty Tiers**:
   - Guesses are always fixed at **6 attempts**.
   - 🟢 **Easy** (2 stints)
   - 🟡 **Medium** (3 stints)
   - 🔴 **Hard** (4–5 stints)
   - 💀 **Expert** (6+ stints)
6. **Auto-Locking Correct Slots**: Correct stints from previous attempts automatically lock into future guess rows to speed up gameplay.
7. **Interactive Sharing**: Copy your Wordle-style score grid with difficulty badge to share with friends or post on social media.

---

## ⚡ Key Features

- 🏀 **Real NBA Career Data**: Pre-extracted using `nba_api` with verified regular season stints (`gamesPlayed >= 1`) and Wikipedia thumbnail headshots.
- 🎲 **Constrained Random Daily Rotation**: 90+ pre-seeded daily puzzles guaranteeing **no two consecutive days share the same difficulty tier**.
- ⚡ **Sub-Millisecond Redis Caching & 24h Proactive Cron Warmer**:
  - Two-tier composite caching: The static daily base puzzle (player, stints, 30 teams) is cached in Redis (`puzzle:daily:YYYY-MM-DD`) with 48h TTL.
  - Proactive background worker (`node-cron`) pre-warms today's and tomorrow's puzzles at **00:00 UTC** and server boot, ensuring **0ms cold-start delay**.
  - Resilient in-memory fallback for offline/local development without Redis.
- 🛡️ **Zero-Trust Backend Grading**: Answers are strictly validated and graded server-side; mystery player timelines are never sent to the client until the game is completed.
- 👤 **Dual-Mode Authentication & Account Linking**: Play instantly as an anonymous guest (`X-Anonymous-Id`). Register an account anytime to atomically migrate your entire guest match history and streak.
- 📅 **Play History & Stats Dashboard**: Monthly calendar view with win/loss indicators, current streak, max streak, win rate, and attempt distribution graphs.
- ♿ **WCAG 2.1 AA Accessibility & Keyboard Navigation**:
  - Full keyboard shortcuts (`1`–`9` to open slot, `Enter` to submit, `Backspace` to delete, `C` to clear, `?` for help, `H` for history).
  - ARIA comboboxes, dialogs, status regions, and screen-reader live announcer (`aria-live="polite"`).
  - Zero Layout Shift (CLS) with responsive `BoardSkeleton` loading state.
- 🔒 **Production Hardened**:
  - **Helmet** security headers with tailored Content Security Policy (CSP).
  - Multi-tier **Rate Limiting** (anti-brute force on auth, spam protection on guess submission, general API protection).
  - Strict 10kb JSON payload size restrictions.
  - Safe error masking preventing stack trace leakage.
  - Rollup manual vendor chunk splitting for sub-220kB client assets.

---

## 🏗️ Technical Architecture

```mermaid
graph TB
    subgraph Client ["Frontend (Vite + React 18 + Tailwind CSS + Framer Motion)"]
        UI[Game Board & Modal Components]
        ZS[Zustand Stores — gameStore & authStore]
        LS[localStorage Rehydration & UTC Stale Guard]
        UI <--> ZS
        ZS <--> LS
    end

    subgraph Server ["Backend (Node.js + Express REST API)"]
        SEC[Helmet + CORS + Rate Limiters]
        MW[Auth JWT & X-Anonymous-Id Middleware]
        RT[API Routes — Puzzle, Auth, History]
        CT[Controllers & Input Validation]
        SV[Services — Puzzle, Grading, History, Auth]
        DOM[Domain Logic — gradeGuess 2-Pass Engine]
        CW[24h Proactive Cron Warmer — node-cron]
        
        SEC --> MW --> RT --> CT --> SV --> DOM
        CW -. "Pre-warm at 00:00 UTC" .-> SV
    end

    subgraph Cache ["Cache Layer (Redis / In-Memory Fallback)"]
        RC[(Redis Cache / In-Memory)]
    end

    subgraph DB ["Database (PostgreSQL + Prisma ORM)"]
        T1[(Teams)]
        T2[(Players)]
        T3[(CareerStints)]
        T4[(DailyPuzzles)]
        T5[(Users)]
        T6[(DailyResults)]
    end

    Client -- "HTTPS / JSON (10kb max)" --> Server
    SV -- "Instant Hit (<1ms)" --> RC
    SV -- "Fallback / Mutations" --> DB
```

For complete technical specifications, mathematical grading proofs, and state lifecycle details, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📁 Repository Structure

```
journeyman/
├── client/                     # Vite + React SPA
│   ├── src/
│   │   ├── components/         # UI components & test suites
│   │   ├── hooks/              # Custom React hooks (keyboard, loader, announcer)
│   │   ├── stores/             # Zustand state management (game, auth, toast)
│   │   ├── services/           # Fetch API client wrapper
│   │   ├── data/               # Static NBA team logos and metadata
│   │   └── styles/             # Tailwind CSS & global tokens
│   ├── vite.config.js          # Vite config with Rollup manual chunking
│   └── package.json
├── server/                     # Express REST API
│   ├── src/
│   │   ├── config/             # Environment variable validation & multi-path .env resolution
│   │   ├── controllers/        # Request/response handlers
│   │   ├── domain/             # Pure Wordle grading logic
│   │   ├── jobs/               # Background scheduled workers (cron cache warming)
│   │   ├── middleware/         # Helmet, rate limiting, JWT auth, anonymousId, CSRF
│   │   ├── routes/             # Express route declarations
│   │   ├── services/           # Business logic & Prisma orchestration
│   │   ├── lib/                # Prisma singleton & resilient Redis cache client
│   │   ├── app.js              # Express application assembly
│   │   └── index.js            # Server entry & graceful shutdown handler
│   ├── tests/                  # Backend unit, security, Redis & E2E integration tests
│   └── package.json
├── shared/                     # Shared constants, types & helpers
│   ├── constants.js            # MAX_ATTEMPTS, FEEDBACK, DIFFICULTY, getDifficulty()
│   ├── constants.test.js       # Shared unit tests
│   └── package.json
├── prisma/
│   ├── schema.prisma           # Prisma database schema
│   ├── seed.js                 # Database seeder (teams, players, stints, puzzles)
│   └── data/seed-data.json     # Extracted NBA player & stint dataset
├── scripts/
│   ├── dev.js                  # Concurrent client + server dev runner
│   ├── generate-puzzles.js     # Constrained random puzzle generator
│   └── fetch-nba-data.py       # Python extraction pipeline (nba_api + Wikipedia)
├── .env.example                # Sample environment variables
├── .eslintrc.cjs               # Monorepo ESLint configuration
├── package.json                # Root npm workspace configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: A running instance (local or hosted on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)).
- **Redis (Optional)**: Local Redis or hosted [Redis Cloud](https://redis.com) / [Upstash](https://upstash.com) (in-memory fallback active if omitted).

### 1. Installation

Clone the repository and install dependencies for all workspaces:

```bash
git clone https://github.com/K-Niv/JourneyMan.git
cd JourneyMan
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Update your `.env` with your PostgreSQL database connection string, Redis URL, and secrets:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/journeyman?sslmode=require"
JWT_SECRET="generate-a-secure-random-secret-key-here"
CLIENT_URL="http://localhost:5173"
REDIS_URL="redis://default:password@host:port"
```

### 3. Database Migration & Seeding

Generate the Prisma client, run migrations, and seed the database with teams, players, stints, and 90+ days of daily puzzles:

```bash
# Push migrations to your database
npm run db:migrate

# Seed database with players and puzzles
npm run db:seed
```

### 4. Running the Application

Launch both the React frontend and Express backend concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:5173/api/health](http://localhost:5173/api/health) (Vite proxied)

---

## 🧪 Testing & Quality Assurance

JourneyMan features a comprehensive, multi-layer testing strategy across all workspace packages:

```bash
# Run all tests across shared, server, and client packages
npm test

# Run ESLint across entire codebase
npm run lint

# Compile production client build
npm run build

# Run the complete single-step quality gate (Lint + Test + Build)
npm run check
```

### Test Suite Breakdown

| Workspace | Test File | Description | Tests |
|-----------|-----------|-------------|-------|
| `shared` | `constants.test.js` | Difficulty tiers, stint counting, constants | 7 |
| `server` | `grading.test.js` | Duplicate franchise Wordle grading engine | 55 |
| `server` | `redis-caching.test.js` | Base puzzle cache, warming worker, profile TTL, fallback | 7 |
| `server` | `puzzle.test.js` | Today's puzzle endpoint, guess validation | 29 |
| `server` | `auth.test.js` | Registration, login, JWT issuance, account linking | 23 |
| `server` | `history.test.js` | Calendar history queries, streak calculations | 10 |
| `server` | `security.test.js` | Helmet headers, CORS, rate limits, payload limits | 8 |
| `server` | `e2e-game-flow.test.js` | Full user lifecycle simulation (guest to member) | 2 |
| `server` | `health.test.js` | Server health check endpoint | 1 |
| `client` | `AccessibilityAndPolish.test.jsx` | Skeletons, keyboard shortcuts, screen reader | 19 |
| `client` | `HistoryComponents.test.jsx` | CalendarGrid, StatsPanel, streak charts | 10 |
| `client` | `AuthComponents.test.jsx` | AuthModal, LoginForm, RegisterForm validation | 9 |
| `client` | `GameOverComponents.test.jsx` | AnswerTimeline, countdown, confetti, modals | 8 |
| `client` | `LandingAndLibrary.test.jsx` | Landing page, button variants, design primitives | 8 |
| `client` | `App.test.jsx` | Root application smoke test | 1 |
| **Total** | **15 Test Suites** | **Comprehensive Full-Stack Coverage** | **197** |

---

## 📡 API Reference

### Daily Puzzle Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/puzzle/today` | Optional (`X-Anonymous-Id` or Bearer) | Fetch today's puzzle (player, stint count, difficulty, available teams, existing progress). Answer is redacted while playing. |
| `POST` | `/api/puzzle/guess` | Optional (`X-Anonymous-Id` or Bearer) | Submit an array of team IDs as a guess. Returns graded feedback and reveals the full timeline upon game over. |

**Sample Guess Payload (`POST /api/puzzle/guess`)**:
```json
{
  "guess": ["team-cle", "team-mia", "team-cle", "team-lal"]
}
```

**Sample Response (`POST /api/puzzle/guess`)**:
```json
{
  "puzzleId": "puz-uuid-101",
  "attemptNumber": 2,
  "maxAttempts": 6,
  "guess": ["team-cle", "team-mia", "team-cle", "team-lal"],
  "feedback": ["correct", "correct", "correct", "correct"],
  "won": true,
  "gameOver": true,
  "answer": [
    { "stintOrder": 1, "teamId": "team-cle", "teamName": "Cleveland Cavaliers", "abbreviation": "CLE", "startYear": 2003, "endYear": 2010 },
    { "stintOrder": 2, "teamId": "team-mia", "teamName": "Miami Heat", "abbreviation": "MIA", "startYear": 2010, "endYear": 2014 },
    { "stintOrder": 3, "teamId": "team-cle", "teamName": "Cleveland Cavaliers", "abbreviation": "CLE", "startYear": 2014, "endYear": 2018 },
    { "stintOrder": 4, "teamId": "team-lal", "teamName": "Los Angeles Lakers", "abbreviation": "LAL", "startYear": 2018, "endYear": 2026 }
  ]
}
```

---

### Authentication & History Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register new user account with `displayName`, `email`, `password`. |
| `POST` | `/api/auth/login` | Public | Authenticate with credentials and receive signed JWT. |
| `POST` | `/api/auth/link` | `Bearer <JWT>` | Migrate anonymous guest games (`anonymousId`) into user account. |
| `GET` | `/api/auth/me` | `Bearer <JWT>` | Retrieve authenticated user profile. |
| `GET` | `/api/history` | `Bearer <JWT>` | Retrieve user results for a calendar month (`?year=2026&month=8`). |
| `GET` | `/api/history/stats` | `Bearer <JWT>` | Retrieve user streak, win rate, and attempt distribution. |

---

## 🚢 Deployment

For complete, step-by-step instructions with copy-paste deployment configs, see the **[Production Deployment Guide](DEPLOYMENT.md)**.

### Deployment Options
- **Decoupled (Recommended)**: Frontend on [Vercel](https://vercel.com) + Backend API on [Render](https://render.com) + Database on [Neon](https://neon.tech).
- **Full-Stack Monolith**: Co-hosted Express SPA on [Render](https://render.com) or [Railway](https://railway.app).
- **Docker Container**: Multi-stage `Dockerfile` ready for Fly.io, Railway, or Google Cloud Run.

### Quick Commands

```bash
# Generate high-entropy JWT Secret
npm run generate-secret

# Deploy Prisma database schema migrations
npm run db:deploy

# Build production client bundles
npm run build

# Start production Express server
npm start
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
NBA team names, logos, and player images are trademarks and copyrights of their respective owners and are used strictly under fair use for educational and demonstrative purposes.
