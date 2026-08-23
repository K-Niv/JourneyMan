# JourneyMan — Daily NBA Puzzle Game 🏀

JourneyMan is a daily NBA puzzle game inspired by Wordle. Players guess the chronological team-by-team career timeline of NBA players.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Node.js, Express
- **Database:** PostgreSQL, Prisma ORM
- **Data Source Pipeline:** `nba_api` (Python) for build-time seed extraction, Wikipedia API for player headshots

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

```bash
# Install dependencies for all workspace packages
npm install
```

### Running Locally

```bash
# Run client and server concurrently
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Health Check:** http://localhost:5173/api/health (proxied)

### Testing

```bash
# Run unit & API tests across packages
npm test
```

## Repository Structure

```
journeyman/
├── client/        # Vite + React SPA
├── server/        # Express REST API
├── shared/        # Shared constants and domain types
├── scripts/       # Data pipeline & dev tooling
├── prisma/        # Database schema, migrations & seed data
└── README.md
```
