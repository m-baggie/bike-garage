# PRD Overview: Bike Garage - Phase 1 MVP

- File: .agents/tasks/prd-bike-garage-phase1.json
- Stories: 12 total (12 open, 0 in_progress, 0 done)

## Quality Gates
- npm run lint
- npm test

## Stories
- [open] US-001: [Setup] Project scaffold — monorepo structure, scripts, and env config
- [open] US-002: [Tree 1 — Backend] Express server with health check and CORS (depends on: US-001)
- [open] US-003: [Tree 1 — Backend] Photo upload endpoint with multer temp storage (depends on: US-002)
- [open] US-004: [Tree 1 — Backend] Claude Vision API integration with structured JSON output (depends on: US-003)
- [open] US-005: [Tree 2 — Scraping] Performance Bicycle part search scraper (depends on: US-001)
- [open] US-006: [Tree 2 — Scraping] Pricing API endpoint — batch pricing for all parts (depends on: US-005)
- [open] US-007: [Tree 3 — Frontend] React + Vite frontend scaffold with routing (depends on: US-001)
- [open] US-008: [Tree 3 — Frontend] Photo upload form component (depends on: US-007)
- [open] US-009: [Tree 3 — Frontend] Analysis results display component (depends on: US-007)
- [open] US-010: [Tree 3 — Frontend] Pricing results display — integrated into results page (depends on: US-009)
- [open] US-011: [Integration] End-to-end flow — upload photo, get analysis, show pricing (depends on: US-004, US-006, US-010)
- [open] US-012: [Integration] Desktop-first layout polish and basic styling (depends on: US-011)
