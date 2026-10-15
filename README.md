# Matchday: football calendar in IST

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
<!-- TODO: replace OWNER/REPO in the badge above once the repo is on GitHub. -->

Fixtures, live scores, league tables and top scorers for Europe's big leagues, the Champions League and more, with every kick-off shown in **India Standard Time** on the correct IST date.

**Live demo:** _TODO: add the Vercel URL_

## Screenshots

<!-- TODO: add screenshots / a short GIF (e.g. docs/screenshots/today.png, tables.png, team.png, mobile.png). -->

| Today (desktop) | Tables | Team page | Mobile |
| --- | --- | --- | --- |
| _screenshot_ | _screenshot_ | _screenshot_ | _screenshot_ |

## Features

- **Matches by IST day**: Today plus any date, with a swipeable date strip showing match counts per day and a date picker for far jumps. Today refreshes every minute.
- **Match cards**: crests, IST kick-off, competition and stage, live/finished scores, and a kick-off countdown ("Starts in 2h 14m", then "Kicking off").
- **Filters**: league chips and a late-night filter (11 PM – 3 AM IST), remembered on this device. Late-night games get a moon icon.
- **Add to calendar**: `.ics` export per match (30-minute alarm), or every upcoming fixture of a team at once.
- **Share**: native share sheet on phones, copy-to-clipboard elsewhere.
- **League tables**: zones per league (Champions League, Europa, relegation…) with a legend and last-five form. Cup league phases (Champions League) too.
- **Top scorers**: goals, assists and penalties per competition.
- **Team pages**: club colours, form, upcoming fixtures and recent results; follow a team with one tap.
- **My Teams**: one feed of upcoming matches for every team you follow.
- **Installable PWA**: works offline with the last data you viewed, and kick-off reminders (while the app is open).
- **Dark and light themes**: a screen-print style built around illustrated artwork, checked for WCAG AA contrast.

## Technical decisions

### A serverless proxy keeps the API key secret

The browser never talks to football-data.org. Every request goes to our own `/api/*` functions (Vercel serverless functions in [`api/`](api)), which add the `X-Auth-Token` header from the `FOOTBALL_DATA_API_KEY` environment variable. The key is never bundled into client code, and the proxy also trims responses to what the UI needs and validates inputs (unknown competition codes and bad team ids get a `400` without spending an upstream request).

### Caching strategy vs the 10 requests/minute limit

The free tier allows 10 upstream requests per minute **for the whole app**, so caching happens at three levels:

1. **CDN (the real protection).** Every successful response sets `Cache-Control: public, max-age=0, s-maxage=…, stale-while-revalidate=…`. Vercel's CDN serves repeat requests from its cache, so a thousand visitors cost the same upstream calls as one. `stale-while-revalidate` means expiry triggers a single background refresh, never a burst.

   | Data | Server/CDN TTL |
   | --- | --- |
   | Matches for a range that includes today | 60 s |
   | Other match ranges | 10 min |
   | Standings | 15 min |
   | Top scorers | 30 min |
   | Team matches | 10 min |
   | Team info, competitions | 24 h |

2. **Per-instance memory cache (best effort).** Serverless instances are short-lived and not shared, so this only helps a warm instance. It also deduplicates concurrent identical requests and serves a stale copy if upstream returns an error or 429.
3. **Client (React Query).** Stale times match the server TTLs. Only Today refetches on window focus and every 60 s; everything else is reused from cache, so moving between days, tabs and pages already loaded costs nothing. Rate-limit errors are retried after the `Retry-After` the API reports.

Request shapes are designed around the limit too. The date strip loads 29 days with one call (3 upstream calls of 10 days), and day pages reuse that range. My Teams reuses the same range for any number of followed teams. The team page's 90-day window is a single upstream call.

### UTC to IST day boundaries

The API speaks UTC; users think in IST (UTC+5:30, no daylight saving). An IST date *D* runs from **18:30 UTC on D−1 to 18:29:59 UTC on D**, so a 12:30 AM IST Champions League game kicks off at 19:00 UTC the *previous* day. The `/api/matches` proxy takes IST dates, widens the upstream request by one day at the start, then filters back down to matches whose IST date is in range. The UI groups and labels everything with `date-fns-tz` in `Asia/Kolkata`. The tests pin the 18:29 vs 18:30 UTC boundary and month, leap-year and year ends.

Two upstream quirks are handled explicitly. `dateTo` is **exclusive**, so we send the day after. Ranges are split into 10-day chunks, the free-tier maximum.

### Why React Query

The app is mostly cached server state with different freshness needs: live today, near-static tables, day-old team info. React Query gives per-query stale times, request deduplication (the slider and the day list share one fetch), background refetching only where it matters, retry with backoff, and keep-previous-data so the UI doesn't flash when switching days. That would otherwise be a lot of hand-written `useEffect` code.

### Smaller decisions

- **Form** isn't provided by the free tier (`form: null`), so the standings endpoint derives each team's last five results from the competition's finished matches.
- **Offline**: the service worker uses *network-first* (5 s timeout) for matches, standings and competitions, not stale-while-revalidate. Online data is then never a step behind (important for live scores), and the last-seen response is still served offline.
- **Reminders** have no push server, so they only fire while the app is open. The UI says so and points to *Add to calendar* for reminders when the app is closed.
- **Free-tier status lag**: a match can stay "scheduled" after it was played. After 3 hours the card says "Awaiting result" instead of "Kicking off".

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router, date-fns(-tz), vite-plugin-pwa (Workbox). Vercel serverless functions for the API. Vitest and React Testing Library for tests.

## Getting started

1. **Get a free API key** at [football-data.org](https://www.football-data.org/client/register). It arrives by email.
2. **Install and configure**

   ```bash
   npm install
   cp .env.example .env.local
   # then set FOOTBALL_DATA_API_KEY=your-key in .env.local
   ```

   `.env.local` is git-ignored. The key is only read on the server.
3. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:5173. A small Vite plugin ([`dev/apiDevMiddleware.ts`](dev/apiDevMiddleware.ts)) serves the `api/` functions locally with the same routing as Vercel, so you don't need the Vercel CLI.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with the API |
| `npm run build` | Typecheck and production build (includes the service worker) |
| `npm run preview` | Serve the production build, API included (to test the PWA/offline mode) |
| `npm test` | Unit and component tests (Vitest) |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run art` / `npm run icons` | Regenerate the hero WebP images / PWA icons |

## Deploying to Vercel

1. Push the repo to GitHub and **import it in Vercel** (framework preset: Vite; defaults are fine).
2. In **Project → Settings → Environment Variables**, add `FOOTBALL_DATA_API_KEY` with your key.
3. Deploy. Files in `api/` become serverless functions; `vercel.json` sends every other route to the single-page app.

## Project structure

```
api/                 Serverless functions (the only code that sees the API key)
  _lib/              Upstream client, caching, HTTP helpers, date maths
  matches.ts         GET /api/matches?from&to   (IST dates)
  competitions.ts    GET /api/competitions
  standings/[code].ts, scorers/[code].ts, teams/[id]/…
src/
  components/        UI (views/ holds the pages)
  hooks/             Data and browser-state hooks
  lib/               Time (IST), .ics writer, reminders, zones, API client…
  types/             API types shared by client and server
dev/                 Vite plugin serving api/ locally
scripts/             Image/icon generators
```

## Credits

- Match data: [football-data.org](https://www.football-data.org)
- Illustrations: _TODO: artist name and link_ (also set `ART_CREDIT` in `src/lib/heroArt.ts`)
