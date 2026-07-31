# Clean City Control Room — Frontend

React + Vite admin dashboard for the GVP / complaints / cleanups civic backend.
All component and page files use the `.js` extension (JSX is enabled for `.js`
files via the Vite config), matching the rest of the app.

## Stack

- React + Vite
- Tailwind CSS (custom civic color/type tokens in `tailwind.config.js`)
- React Router
- Axios
- React-Leaflet (maps)
- Recharts (charts)
- TanStack Query (data fetching/caching)

## Setup

```bash
npm install
cp .env.example .env   # then set VITE_API_BASE_URL to your FastAPI backend
npm run dev
```

The app expects your FastAPI backend to expose:

- `GET /health`
- `GET /api/gvps`
- `GET /api/gvps/{id}`
- `GET /api/gvps/near`
- `GET /api/complaints`
- `GET /api/cleanups`

`Analytics` and `Predictions` call `GET /api/analytics/features` and
`GET /api/predictions` respectively. Until those endpoints exist, the
corresponding services (`src/services/analyticsService.js`,
`src/services/predictionService.js`) automatically fall back to mock data and
the pages show a "coming soon" / placeholder banner — no code changes needed
once the real endpoints ship, just remove the try/catch fallback if you want
to hard-require them.

## Structure

```
src/
├── components/    Reusable UI: Navbar, Sidebar, tables, charts, badges, map
├── pages/         One file per route (Dashboard, GVPs, Complaints, ...)
├── services/      Axios calls per resource
├── hooks/         TanStack Query hooks wrapping each service
├── layouts/        MainLayout (sidebar + navbar shell)
└── routes.js       Route table
```

## Notes on the GVP data shape

Components read fields defensively (`risk_level` or `riskLevel`, `id` or
`_id`, etc.) so they work whether your backend returns snake_case or
camelCase. Adjust the field lookups in `GVPTable.js`, `MapView.js`, and
`SummaryCards.js` once your real schema is finalized.
