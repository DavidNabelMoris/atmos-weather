# Atmos Weather

A weather dashboard: current conditions, hourly sparkline, 3-day forecast,
air quality, sun/moon times, city search with autocomplete, browser-saved
favorite cities, and a background that shifts with the weather (a CSS
gradient by default, replaced by a real photo when a Pixabay key is
configured).

Plain TypeScript compiled to ES modules on both ends — no frontend
framework, no bundler. The browser loads the compiled `.js` files directly
as `<script type="module">`.

## Tech stack

- **Backend:** Node.js + Express 5, TypeScript, compiled with `tsc` (no
  bundler/transpiler beyond that).
- **Frontend:** Vanilla TypeScript + DOM APIs, hand-rolled inline SVG icons,
  plain CSS (custom properties for theming, no preprocessor).
- **External APIs:** [WeatherAPI.com](https://www.weatherapi.com/) for
  forecast data, geocoding/search suggestions; [Pixabay](https://pixabay.com/)
  for weather-mood background photos (optional).
- **Deployment:** Vercel — static frontend + the Express app wrapped as one
  serverless function.

## Project structure

```
src/
  backend/
    server.ts             Express app: static file serving + 3 API routes
    weatherApi.ts          WeatherAPI.com client (forecast, city search)
    backgroundPhotoApi.ts  Pixabay client (weather category -> photo URL)
  frontend/
    index.html              Page shell
    styles.css               All styling (custom properties, glass-panel look)
    app.ts                   Main controller: fetches weather, renders the UI,
                             search + autocomplete, favorites (localStorage),
                             side menu
    background.ts            Maps condition -> Pixabay category, fetches and
                             applies the background photo, caches by category
    weatherCategories.ts     WeatherAPI condition code -> one of 10 broad
                             categories (clear/rain/snow/...), used for icons
                             and backgrounds
    icons.ts                 Inline SVG icon functions (no icon font/library)
    WEATHER_CONDITIONS.md    Reference table of all 48 WeatherAPI condition
                             codes and which category each maps to
api/
  index.js                  Vercel serverless entry point, re-exports the
                             compiled Express app
scripts/
  prepare-static.mjs        Post-build step: copies index.html/styles.css
                             into dist/frontend/ and rewrites asset paths to
                             absolute, so dist/frontend/ is a self-contained
                             static bundle for Vercel
vercel.json                  Vercel build/routing config
dist/                         tsc output (git-ignored), mirrors src/ 1:1 plus
                             the static bundle prepare-static.mjs adds
```

## How it fits together

The frontend never talks to WeatherAPI.com or Pixabay directly — both API
keys live server-side only. `app.ts` calls three backend routes:

| Route | Backed by | Purpose |
|---|---|---|
| `GET /api/weather?location=` | `weatherApi.ts` → WeatherAPI `forecast.json` | Current conditions + 3-day forecast + alerts + AQI, used to render the whole dashboard |
| `GET /api/search-cities?q=` | `weatherApi.ts` → WeatherAPI `search.json` | City-name autocomplete suggestions while typing in the search box |
| `GET /api/background-photo?category=` | `backgroundPhotoApi.ts` → Pixabay | A photo URL matching the current weather mood (e.g. `Rain_Night`), used as the page background |

On every render, `app.ts` also derives a broad `category` (via
`weatherCategories.ts`) from the numeric WeatherAPI condition code and
whether it's day or night, and:
- sets a CSS class on `<body>` for the gradient background (`background.ts`
  is not involved — this part is instant, no network call), and
- asynchronously asks `/api/background-photo` for a real photo to layer on
  top, caching the result per category so switching between the same
  conditions doesn't re-fetch.

Favorites are stored client-side only, in `localStorage` under
`atmos-weather:favorites` — no backend involvement.

## Environment variables (`.env`)

```
WEATHER_API_KEY=      # required — app throws on startup without it
PIXABAY_API_KEY=      # optional — background photos are skipped (falls
                       # back to CSS gradient) if unset; route returns 503
PORT=5500              # optional, local dev only
```

## Running locally

```
npm install
npm run build   # tsc + prepare-static.mjs -> dist/
npm run serve   # node --env-file=.env dist/backend/server.js
# or: npm start  (build + serve in one go)
```

Then open `http://localhost:5500`.

## Deployment

Vercel builds with `npm run build`, serves `dist/frontend/` as static
output, and routes everything under `/api/*` to `api/index.js`, which is
just `export { default } from "../dist/backend/server.js"` — the same
Express app used locally, wrapped as one serverless function. `server.ts`
skips its own `app.listen(...)` when `process.env.VERCEL` is set, since
Vercel's runtime handles the listening itself.

## Known rough edges

- `server.ts` has a `GET /parallax` route redirecting to
  `src/frontend/parallax.html`, but that file doesn't exist yet.
- The background-photo pipeline threads a `city` string through from
  `app.ts` → `background.ts` → `/api/background-photo?...&city=`, but the
  backend route/`backgroundPhotoApi.ts` don't read or use that parameter
  yet — it's currently a no-op on the server side.
