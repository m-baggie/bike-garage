# Bike Garage — Team Workflow Notes

A practical rundown of how we build with **Ralph** (AI agent loop) + **WorkTrunk** (`wt`) for branch management.

---

## Overview

```
PRD (JSON) → Ralph builds stories → wt merges to main → git push
```

- **Ralph** reads a PRD JSON, executes one story per iteration, and commits the result
- **WorkTrunk (`wt`)** manages git worktrees — isolated branches per feature, squash-merges back to main
- **PRDs** are the single source of truth — story status is tracked directly in the JSON file

---

## The Core Workflow

### 1. Create a PRD
Use Claude Code to generate the PRD JSON via the `/prd` skill.

PRDs live in `.agents/tasks/`:
```
.agents/tasks/prd-bike-garage-phase1.json
.agents/tasks/prd-bike-garage-phase2.json
etc.
```

**Critical rule: commit and push the PRD before creating a worktree branch.**
The worktree branches from `main` — any uncommitted files on main won't exist in the new worktree.

```bash
git add .agents/tasks/prd-<name>.json
git commit -m "chore: add <name> PRD"
git push
```

---

### 2. Create a Worktree Branch

```bash
wt switch --create feat/<descriptive-name>
# e.g. wt switch --create feat/phase2-interactive-ui
```

This creates an isolated git worktree at `~/Dev/bike-garage.<branch-name>` so you work on a clean branch without touching main.

**Branch naming convention:**
```
feat/phase1-bike-garage-mvp
feat/phase1-1-colorblind-badges
feat/phase2-interactive-ui
feat/phase2-1-repair-focus
feat/phase2-3-ui-polish
```

---

### 3. Set Up the Worktree

Every new worktree needs dependencies and env vars installed fresh:

```bash
nvm use 20                          # Node 20 required
npm install                         # root (concurrently)
npm install --prefix server         # server deps
npm install --prefix client         # client deps
cp ~/Dev/bike-garage/server/.env ~/Dev/bike-garage.<branch>/server/.env
# .env is gitignored — must be copied manually every time
```

---

### 4. Run Ralph

```bash
ralph build
# Select the correct PRD from the picker — double check before Enter
```

Ralph works through stories sequentially, one per iteration:
- Picks the next `open` story with no unmet dependencies
- Runs the Claude Code agent to implement it
- Commits the result
- Updates the story status to `done` in the PRD JSON

**Story statuses:**
| Status | Meaning |
|---|---|
| `open` | Ready to build |
| `in_progress` | Currently being built (locked) |
| `done` | Complete |
| `superseded` | Replaced by an amended story |

**If a story gets stuck `in_progress`** (e.g. after a crash or interrupt):
```bash
# Manually edit the PRD JSON and change "in_progress" → "open"
# Then re-run ralph build
```

---

### 5. Monitor Progress

```bash
ralph overview                      # summary of story statuses
tail -f .ralph/activity.log         # live activity feed
tail -f .ralph/errors.log           # errors
```

---

### 6. Merge and Push

```bash
wt merge       # squash all branch commits → rebase → fast-forward to main → delete branch
git push       # push main to GitHub
```

`wt merge` is equivalent to GitHub's "Squash and merge" but fully local. It:
1. Squashes all commits on the branch into one
2. Generates a commit message (LLM-assisted)
3. Rebases onto main
4. Fast-forward merges to main
5. Deletes the worktree and branch

**If `wt merge` is blocked by uncommitted changes on main:**
```bash
cd ~/Dev/bike-garage
git add <file>
git commit -m "chore: ..."
cd ~/Dev/bike-garage.<branch>
wt merge
```

---

## The `ralph amend` Command

`ralph amend` is used when requirements change mid-build — it intelligently updates the PRD rather than manually editing stories.

### What it does
Given a plain-english description of a change, `ralph amend`:
1. **Analyzes cascading impact** — walks the dependency graph and checks semantic similarity across all stories
2. **Supersedes affected open stories** — marks them `superseded` and creates replacement stories with updated requirements
3. **Surfaces gaps in done stories** — if completed work is now insufficient, creates new gap stories
4. **Writes an amendment log** — records what changed and why

### Usage
```bash
ralph amend "add rate limiting to all API endpoints"
ralph amend "switch from Cheerio to Puppeteer for scraping" --dry-run
```

### Flags
| Flag | Description |
|---|---|
| `--dry-run` | Preview impact without modifying any files |
| `--gap-mode append` | Add gap stories to the existing PRD (default) |
| `--gap-mode new-file` | Write gap stories to a separate `prd-amend-<slug>.json` |

### Example scenario
Amendment: `"add rate limiting to API"`

- `US-001` (done) — auth setup: gap revealed → new story `US-008` created
- `US-003` (open) — API routes: superseded → replaced by `US-007` with rate limiting in acceptance criteria

Result in PRD:
```json
{ "id": "US-003", "status": "superseded", "amendedBy": "US-007" }
{ "id": "US-007", "status": "open", "replacementOf": "US-003", ... }
{ "id": "US-008", "status": "open", "dependsOn": ["US-001"], ... }
```

### When to use amend vs. creating a new PRD
- **Use `amend`** when a requirement change affects stories in an existing in-flight PRD
- **Use a new PRD** for a distinct new phase or feature that doesn't overlap with current work

---

## The `--parallel` Flag (Attempted — Not Stable)

We attempted to use `ralph build --parallel` to run multiple stories simultaneously across git worktrees.

### How it was designed to work
```bash
ralph build --parallel              # up to 4 concurrent stories
ralph build --max-parallel 3        # set concurrency limit
```

Each story would get its own worktree + tmux session, with ralph managing:
- `wt switch -c ralph-<story-id>` — create isolated worktree per story
- Agent runs in tmux session `sidecar-ws-<story-id>`
- `wt merge ralph-<story-id>` — merge completed story back
- `wt remove ralph-<story-id>` — cleanup

### Why we're not using it
Parallel mode requires:
1. `wt` (WorkTrunk) on PATH ✓
2. `tmux` installed and available
3. Stories with no shared file dependencies (merge conflicts are hard to resolve automatically)
4. Stable story isolation — currently stories in this codebase have too many shared files (app.js, ResultsPage.jsx) to safely parallelize

**Current approach: sequential build per worktree.** Each phase gets its own branch, stories run one at a time. This is slower but reliable.

### Revisiting parallel mode
Parallel mode will be more viable when:
- Stories are scoped to clearly separate files/modules
- The codebase is split into more isolated packages
- tmux is consistently available in the dev environment

---

## Common Gotchas

| Problem | Fix |
|---|---|
| PRD not in ralph picker | Forgot to commit to main before branching — `git rebase main` in worktree |
| Story stuck `in_progress` | Edit PRD JSON manually: `"in_progress"` → `"open"` |
| Ralph picks wrong PRD | Ctrl+C, re-run, check picker carefully |
| Server exits immediately | Wrong Node version — `nvm use 20` |
| `cors` package not found | Run `npm install --prefix server` |
| `vite: command not found` | Run `npm install --prefix client` |
| Port 5173 already in use | `kill $(lsof -ti :5173)` |
| `kill $(lsof -ti :3001)` fails | Nothing on that port — skip it |
| API key auth error | `.env` missing in worktree — copy it manually |
| GitHub push blocked | `.env.save` committed — rotate key, `git commit --amend`, `git push --force` |
| `wt merge` blocked | Uncommitted changes on main — commit them first |

---

## Running the App Locally

```bash
nvm use 20
npm run dev         # starts both Vite (5173) and Express (3001) via concurrently
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/api/health

---

## Toolchain Summary

| Tool | Purpose |
|---|---|
| **Ralph** (`ralph-ai`) | AI agent loop — builds stories from PRD |
| **WorkTrunk** (`wt`) | Git worktree management — branch per feature |
| **Claude Code** | Agent runner for Ralph + PRD generation |
| **concurrently** | Runs client + server together in dev |
| **Node 20** | Required runtime (Node 18 has undici incompatibility) |
