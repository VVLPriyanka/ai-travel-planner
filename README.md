# Voyage — AI Travel Planner

A multi-user web app that generates a day-by-day travel itinerary, budget estimate,
hotel suggestions, and a climate-aware packing list using an LLM agent — with full
authentication, per-user data isolation, and an editable itinerary.

Built for the Trao Full Stack Engineering Assessment.

---

## 1. Project Overview

Users register, describe a trip (destination, number of days, budget tier,
interests), and an AI agent drafts a complete itinerary: activities for every day,
a cost breakdown, hotel recommendations, and a packing checklist tailored to the
destination's climate and the traveler's planned activities. The itinerary stays
editable afterward — activities can be added or removed, and any single day can be
regenerated with free-text feedback (e.g. *"more outdoor activities"*).

Every trip is scoped to its owner. There is no route, query, or document in this
app that can be reached by a user other than the one who created it.

---

## 2. Tech Stack

| Layer       | Choice                                   |
|-------------|-------------------------------------------|
| Frontend    | Next.js 16 (App Router) + Tailwind CSS v4 |
| Backend     | Node.js + Express                         |
| Database    | MongoDB + Mongoose                        |
| Auth        | JWT (jsonwebtoken) + bcrypt password hashing |
| AI agent    | Google Gemini (`gemini-2.5-flash`), with a deterministic mock-data fallback |
| Language    | Plain JavaScript (ES2020+, CommonJS backend / ESM frontend) |

**Why JavaScript instead of TypeScript:** the assessment lists TypeScript as
preferred but explicitly allows JavaScript. For a project of this scope built in a
short timeframe, plain JS removes the build-step/type-authoring overhead while the
codebase still keeps strict module boundaries (controllers → services → models) and
consistent object shapes, which is what TypeScript's structural typing would mostly
be protecting here. If this were headed for a larger team or a longer-lived
codebase, TypeScript would be the right call — the Mongoose schemas in
`backend/models/` are already written in a shape that would convert to interfaces
with minimal change.

---

## 3. High-Level Architecture

```
ai-travel-planner/
├── backend/                  Express REST API
│   ├── config/db.js          Mongoose connection (degrades gracefully if unreachable)
│   ├── middleware/
│   │   ├── auth.js           JWT verification → attaches req.user.id
│   │   └── errorHandler.js   Centralized error formatting (validation, duplicate key, 404, 500)
│   ├── models/
│   │   ├── User.js           email + bcrypt hash (hash never serialized)
│   │   └── Trip.js           userId-scoped trip: itinerary, budget, hotels, packing list
│   ├── controllers/          Request handlers — all trip queries filtered by req.user.id
│   ├── routes/                auth + trip route definitions
│   ├── services/aiService.js  All Gemini calls + retry/backoff + mock-mode fallback
│   └── server.js              App wiring, CORS, health check
│
└── frontend/                 Next.js App Router client
    ├── app/                  Routes: / , /login , /register , /dashboard
    ├── components/           TripForm, TripList, DayCard, BudgetReceipt, HotelList, PackingList, Navbar
    ├── context/AuthContext.js Session state (JWT in localStorage, restored + verified on load)
    └── lib/api.js              Single fetch wrapper used by every API call
```

**Request flow:** Client → `Authorization: Bearer <JWT>` → Express `requireAuth`
middleware decodes the token and attaches `req.user.id` → every controller method
queries Mongo with `{ _id: tripId, userId: req.user.id }` → Gemini is called only
from `services/aiService.js`, never directly from a controller.

---

## 4. Authentication & Authorization

- **Registration:** password hashed with `bcrypt` (cost factor 10) before storage;
  the hash field uses Mongoose's `select: false` so it's never returned by a normal
  query, and `toJSON` strips it again as a second layer of defense.
- **Login:** compares the submitted password against the stored hash with
  `bcrypt.compare`; on success, issues a JWT (`{ id: userId }`, 7-day expiry by
  default).
- **Authorization:** every `/api/trips/*` route runs through `requireAuth`
  middleware. There is no endpoint that accepts a `userId` from the client — it is
  always taken from the verified token (`req.user.id`), so a user cannot impersonate
  another account by editing a request body.
- **Data isolation:** every Mongoose query for a trip is filtered by
  `{ userId: req.user.id }`. Requesting another user's trip ID returns a generic
  `404 Trip not found` rather than `403`, so the API never confirms or denies that a
  given trip ID exists for someone else.
- **Frontend:** the JWT is stored in `localStorage` and attached to every request;
  `/dashboard` checks the session on mount and redirects to `/login` if it's missing
  or invalid. (See trade-offs below on `localStorage` vs. an httpOnly cookie.)

---

## 5. AI Agent Design

All AI logic lives behind one module, `backend/services/aiService.js`, with three
entry points used by the trip controller:

1. **`generateItinerary`** — builds the full day-by-day plan, hotel suggestions, and
   budget breakdown for a new trip.
2. **`regenerateDay`** — rewrites a single day's activities based on free-text
   feedback, leaving the rest of the trip untouched.
3. **`generatePackingList`** — the creative feature; see below.

**Prompting approach:** each prompt instructs Gemini to return *only* a JSON object
matching an exact schema (`generationConfig: { responseMimeType: "application/json" }`),
so the response can be parsed directly into the Mongoose document shape with no
free-text post-processing.

**Resilience:** `fetchWithRetry` retries failed/rate-limited Gemini calls up to 5
times with exponential backoff (1s → 2s → 4s → 8s → 16s). If Gemini still fails
after retries — or if no API key is configured at all — the service transparently
falls back to a deterministic, rule-based generator (`buildMockItinerary`) instead
of failing the request. The trip is tagged `generationSource: "mock" | "gemini"` so
the UI can be honest with the user about which one produced their itinerary (see the
banner on the dashboard).

**Why mock mode matters here:** it means the entire application — auth, itinerary
CRUD, budget math, packing list, every interactive feature — is fully demoable and
gradeable with **zero API keys and zero cost**, while still being fully forward-
compatible with a real key (just set `GEMINI_API_KEY` in `.env`).

---

## 6. Creative Feature: Weather-Aware Packing Assistant

**Problem:** travelers often pack for the wrong climate or forget gear that's
specific to what they're actually planning to do (hiking boots, a modest layer for
temple visits, a reusable water bottle for a hot-climate city).

**What it does:** when a trip is created, the backend infers a climate profile for
the destination (hot / mild / cold / rainy) and combines it with the traveler's
selected interests to generate a categorized packing checklist — Documents,
Clothing, Gear, Other — each item tagged with a short reason it's included (e.g.
*"Adventure activities are planned in your itinerary"*). The list is interactive:
checking an item persists immediately (`PATCH /api/trips/:id/packing/:itemId`), and
the whole list can be regenerated on demand.

**Implementation note (and an honest limitation):** there's no paid weather API in
the loop. The rule-based mode keys off a small set of well-known hot/cold/rainy
cities and otherwise deterministically hashes the destination name to a climate
profile, so results are stable per-destination but are a *seasonally-naive
approximation*, not a real forecast. When `GEMINI_API_KEY` is set, the draft list is
sent to Gemini to be refined and expanded with destination-specific reasoning,
which produces noticeably better results than the rule-based draft alone. A real
version of this feature would call a weather/climatology API (e.g. Open-Meteo) keyed
on destination + travel month — documented here rather than silently glossed over.

---

## 7. Key Design Decisions & Trade-offs

| Decision | Reasoning | Trade-off accepted |
|---|---|---|
| JWT in `localStorage`, not an httpOnly cookie | Simpler for a decoupled frontend/backend on two different domains (Vercel + Render), no CSRF-token plumbing needed | Vulnerable to token theft via XSS if the frontend ever rendered untrusted HTML. Mitigated by React's default escaping and the app never rendering raw user HTML. |
| Mock-mode AI fallback instead of failing the request | Keeps the app demoable/gradeable without a paid key, and keeps trip creation resilient to live Gemini outages | The "AI-generated" itinerary in mock mode is rule-based, not actually model-generated — clearly labeled in the UI so this is never hidden from the user |
| 404 (not 403) for another user's trip | Avoids leaking whether a given trip ID exists at all | Slightly less precise error semantics for legitimate debugging |
| Budget `activities` total recomputed server-side on every itinerary edit | Keeps the budget receipt trustworthy after manual add/remove edits, instead of going stale | `transport`/`accommodation`/`food` are not recomputed (they aren't tied to individual activities), so editing many activities can shift the realism of the original AI estimate |
| Two independent `package.json`s (`backend/`, `frontend/`) instead of a monorepo tool (Turborepo/Nx) | Matches the assessment's directory layout exactly; nothing to configure | No shared lint/test pipeline; each app installs and runs independently |
| Deterministic climate inference instead of a weather API | Zero extra API key/cost, works offline, good enough for a packing *suggestion* | Not an actual forecast — documented as a known limitation |

---

## 8. Known Limitations

- No automated test suite (unit/integration tests) — given the assessment's time
  box, manual verification and the resilience patterns above (graceful DB-down
  handling, AI fallback, centralized error handling) were prioritized instead.
- Packing-list climate inference is rule-based, not a live forecast (see §6).
- No password reset / email verification flow.
- No rate limiting on auth endpoints (would add `express-rate-limit` before any
  real production use).
- Trip `interests` are free-form strings from a fixed frontend list; the backend
  doesn't currently validate them against an enum, so a hand-crafted API request
  could store arbitrary interest strings (low risk, but worth tightening).

---

## 9. Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- A MongoDB connection string (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster)
- *(Optional)* a free [Gemini API key](https://aistudio.google.com/app/apikey) — the app runs in mock mode without one

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET (and GEMINI_API_KEY if you have one)
npm install
npm run dev        # nodemon, http://localhost:5000
```

`GET /api/health` reports DB connection status and whether the app is in
`mock` or `gemini` AI mode — useful for confirming your `.env` took effect.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local if your backend isn't on localhost:5000
npm install
npm run dev        # http://localhost:3000
```

Open `http://localhost:3000`, register an account, and create a trip.

### Deployed Setup

1. **Backend** (Render / Railway): point it at the `backend/` folder, set the build
   command to `npm install` and start command to `npm start`, and configure these
   environment variables in the provider's dashboard (never commit `.env`):
   - `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (your deployed frontend URL),
     and optionally `GEMINI_API_KEY`.
2. **Frontend** (Vercel): point it at the `frontend/` folder and set
   `NEXT_PUBLIC_API_URL` to your deployed backend's URL.
3. Confirm `GET <backend-url>/api/health` returns `200` before testing the frontend
   against it.

---

## 10. API Reference (summary)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | Returns JWT |
| GET  | `/api/auth/me` | ✓ | Current user |
| POST | `/api/trips` | ✓ | Create trip → generates itinerary, budget, hotels, packing list |
| GET  | `/api/trips` | ✓ | List the current user's trips |
| GET  | `/api/trips/:id` | ✓ | Get one trip (must be owned) |
| DELETE | `/api/trips/:id` | ✓ | Delete a trip |
| POST | `/api/trips/:id/activities` | ✓ | Add an activity to a day |
| DELETE | `/api/trips/:id/activities/:activityId` | ✓ | Remove an activity |
| POST | `/api/trips/:id/regenerate-day` | ✓ | AI-regenerate one day with feedback |
| PATCH | `/api/trips/:id/packing/:itemId` | ✓ | Toggle a packing item's checked state |
| POST | `/api/trips/:id/packing/regenerate` | ✓ | Regenerate the packing checklist |
| GET | `/api/health` | – | DB + AI mode status |

---

## 11. Submission Checklist

- [x] Multi-user auth with strict data isolation
- [x] Trip input form (destination, days, budget tier, interests)
- [x] AI itinerary generator (with offline-safe mock fallback)
- [x] Budget estimation, recomputed on edits
- [x] Editable itinerary (add / remove activity, regenerate a day)
- [x] Hotel suggestions
- [x] Creative feature: Weather-Aware Packing Assistant
- [x] Responsive, accessible UI (visible focus states, reduced-motion respected)
- [ ] Deployment link — *add after deploying*
- [ ] Walkthrough video link — *add after recording*
