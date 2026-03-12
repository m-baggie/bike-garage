# Bike Garage

Upload a bike photo and get a Claude Vision analysis of parts, condition, and priority — plus real pricing from Performance Bicycle.

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd bike-garage
```

### 2. Set environment variables

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```
ANTHROPIC_API_KEY=sk-ant-...   # Required: get from https://console.anthropic.com
CLIENT_URL=http://localhost:5173
PORT=3001
```

**Note:** If `ANTHROPIC_API_KEY` is missing, the server will start but log a warning and photo analysis will fail.

### 3. Install dependencies

```bash
npm install           # installs root devDependencies (concurrently)
npm install --prefix server
npm install --prefix client
```

### 4. Run the app

```bash
npm run dev
```

This starts both the Express API server (port 3001) and the Vite dev server (port 5173) concurrently.

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client + server in development mode |
| `npm run lint` | Run ESLint on the client |
| `npm test` | Run tests for server and client |

## Stack

- **Frontend:** React + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **Vision:** Claude Vision API
- **Scraping:** Cheerio
