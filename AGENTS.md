# AGENTS — Bike Garage

Operational reference for automated build agents.

## Project Layout

```
/                   Root — root package.json with monorepo scripts
/client/            React + Vite frontend (port 5173)
/server/            Node.js Express backend (port 3001)
/server/src/        Server source (index.js entry point)
```

## Setup

```bash
npm install                     # root (concurrently)
npm install --prefix server     # express, multer, cors, dotenv, axios, cheerio
npm install --prefix client     # react, vite, eslint
cp server/.env.example server/.env   # add ANTHROPIC_API_KEY
```

## Build / Dev

```bash
npm run dev        # starts both client (5173) and server (3001) via concurrently
```

## Quality Gates (must pass before commit)

```bash
npm run lint       # ESLint on /client
npm test           # node --test in /server; placeholder echo in /client
```

## Environment

- `server/.env` — required (gitignored)
- `server/.env.example` — template with `ANTHROPIC_API_KEY` and `CLIENT_URL`
- Missing `ANTHROPIC_API_KEY` logs a `[WARNING]` at server startup (no crash)

## Test Runner

- Server: Node.js built-in `node --test` (files matching `*.test.js`)
- Client: placeholder (no framework yet; add vitest when needed)
