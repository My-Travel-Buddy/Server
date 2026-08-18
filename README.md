# My Travel Buddy — Server

My Travel Buddy is a Node.js and Express backend that connects to PostgreSQL through Sequelize.

The server handles user authentication, saved trips, activities, checklist items, AI-generated itineraries using Gemini, and visa requirement lookups.

Requires **Node 20 or newer**.

## Getting Started

Install the dependencies:

```bash
npm install
```

Create your local database. The name must match the one in `DATABASE_URL`:

```bash
createdb travel_buddy
```

Create your `.env` file and fill in the values:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

The server runs locally on:

```text
http://localhost:8080
```

You should see:

```text
🐘 Database connection established.
🧩 Models synced.
🚀 Server is running on PORT: 8080
```

Tables are created automatically on boot — `app.js` calls `db.sync()`, which
adds any missing tables without touching existing data. You do not need to seed
to get started.

Health check: <http://localhost:8080/check>

## Environment Variables

Copy `.env.example` and fill it in. **Five variables are required at boot** —
the server throws and refuses to start without them.

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | **yes** | Signs the login cookie. Changing it logs everyone out. |
| `AUTH0_DOMAIN` | **yes** | Auth0 tenant, no `https://`. |
| `AUTH0_AUDIENCE` | **yes** | Auth0 API identifier. Must match the frontend's `VITE_AUTH0_AUDIENCE` byte for byte, or login appears to work and every API call then returns 401. |
| `MY_TRAVEL_BUDDY` | **yes** | Google Gemini API key. |
| `FRONTEND_URL` | **yes in practice** | The single origin CORS allows. Defaults to `http://localhost:5173`. A mismatch makes every request fail with "Failed to fetch". |
| `DATABASE_URL` | no | Postgres connection string. Falls back to a local database (see `db/index.js`). |
| `NODE_ENV` | no locally, **yes in production** | See Deployment — it controls both the auth cookie and database SSL. |
| `PORT` | no | Defaults to `8080`. |
| `JWT_EXPIRES_IN` | no | Cookie lifetime. Defaults to `7d`. |
| `AUTH0_CLAIMS_NAMESPACE` | no | Namespace for custom Auth0 claims. |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.1-flash-lite`. |
| `MAX_ITINERARY_DAYS` | no | How many days one itinerary request plans. Defaults to `14`. |
| `VISA_API` | no | RapidAPI key for visa lookups. Without it, visa routes return 503. |

Never commit `.env`. Commit `.env.example` instead.

## Tech Stack

* Node.js / Express
* PostgreSQL / Sequelize
* bcrypt (password hashing)
* JSON Web Tokens (httpOnly cookie)
* Auth0 (social login)
* Google Gemini (`@google/genai`)
* RapidAPI `visa-requirement` (visa data)

## Project Structure

```text
app.js                    middleware, CORS, route mounting, server start

db/
  index.js                Sequelize connection
  seed.js                 sample data — DROPS all tables

models/
  index.js                associations
  User.js
  Trip.js
  Activity.js
  checklist.js

routes/
  index.js                collects the routers
  auth.routes.js
  trips.js
  activities.js
  checklist.routes.js
  ai.routes.js
  visa.js

middleware/
  auth.js                 exports requireAuth
```

## API Routes

All `/trips` routes require authentication.

### Auth — `/auth`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/signup` | Create an account |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Clear the cookie |
| POST | `/auth/auth0` | Sync an Auth0 user into our database |
| GET | `/auth/me` | The currently logged-in user |

### Trips — `/trips`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/trips` | All trips for the logged-in user |
| GET | `/trips/:id` | One trip, with activities and checklist |
| POST | `/trips/post` | Create a trip |
| PATCH | `/trips/:id/edit` | Update a trip |
| DELETE | `/trips/:id/delete` | Delete a trip and its children |

### Activities

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/trips/:tripId/activities` | Activities for a trip |
| GET | `/trips/:tripId/activities/:activityId` | One activity |
| POST | `/trips/:tripId/activities` | Add an activity |
| PATCH | `/trips/:tripId/activities/:activityId` | Update an activity |
| DELETE | `/trips/:tripId/activities/:activityId` | Delete an activity |

### Checklist

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/trips/:TripId/checklist` | Checklist for a trip |
| GET | `/trips/:TripId/checklist/:id` | One checklist item |
| POST | `/trips/:TripId/checklist/post` | Add an item |
| PATCH | `/trips/:TripId/:id/checklist/edit` | Toggle or edit an item |
| DELETE | `/trips/:id/checklist/delete` | Delete an item |

### AI and visa

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/trips/itinerary` | Generate an itinerary with Gemini |
| POST | `/trips/visa` | Visa requirements for a passport → destination pair |
| GET | `/trips/visa/countries` | Passport and destination country lists for the dropdowns |

### Utility

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/check` | Health check — returns `{ "status": "ok" }` |

## AI Itinerary Generation

The frontend sends:

```json
{
  "destination": "Kyoto, Japan",
  "startDate": "2026-08-15",
  "endDate": "2026-08-20",
  "budget": "1500",
  "interests": ["Food & Culinary", "Culture & History"]
}
```

The server works out how many days the trip covers, subtracts the final travel
day, and asks Gemini for exactly that many days — stating the number in the
prompt rather than leaving the model to infer it from the date range.

**Long trips are capped at `MAX_ITINERARY_DAYS` (default 14).** A 45-day trip
would need 132 activities, which one response cannot hold — the model quietly
returns two days instead. So the server plans the first stretch and tells the
frontend what was covered:

```jsonc
{
  "tripDays": 45,        // the whole trip
  "generatedDays": 14,   // how many were planned
  "hasMoreDays": true    // the UI shows a note when this is true
}
```

Measured on `gemini-3.1-flash-lite`: roughly 2s of overhead plus 0.35s per day
(7 days ≈ 5.7s, 14 ≈ 7.6s, 20 ≈ 9.6s, 30 ≈ 15s).

A `responseSchema` forces the JSON shape, so the output always matches what the
frontend and database expect. Activity categories are restricted to:

```text
Food  Sightseeing  Culture  Adventure  Shopping  Transportation  Entertainment  Other
```

The checklist is normalized server-side — plain strings are coerced to
`{ text, completed }` and anything without real text is dropped.

## Visa Requirements

Visa data comes from the RapidAPI `visa-requirement` API.

```http
POST /trips/visa
```

```json
{ "passportCode": "US", "destinationCode": "CN" }
```

`GET /trips/visa/countries` returns the two lists the dropdowns need. They are
**not the same list**: passports has ~200 entries, destinations ~212 — Bermuda,
Hong Kong and Macau are destinations but do not issue their own passports. The
lists are cached in memory after the first request, so page views do not spend
API quota.

### Gemini fallback

The visa API has a monthly request limit. When it is exhausted (HTTP 429) or
unreachable, the server asks Gemini instead and returns the answer in the same
shape, tagged with its origin:

```jsonc
{ "source": "gemini", "data": { … } }   // AI-generated fallback
{ "source": "visa-api", "data": { … } } // the visa data service
```

The frontend must show which one it received — an AI guess about entry
requirements is not equivalent to a licensed visa database.

## Database

Sequelize manages the models and relationships:

* `User` ↔ `Trip` — many-to-many through `User_Trip`
* `Trip` → `Activity` — one-to-many
* `Trip` → `Checklist` — one-to-many

`Trip` stores `destination`, `date_Range` (a Postgres `DATERANGE`) and `budget`
(`DECIMAL(10,2)`, so the maximum is 99,999,999.99).

### Seeding

```bash
npm run seed
```

**Warning: this drops and recreates every table.** Any accounts and trips you
created are deleted. It refuses to run when `NODE_ENV=production`.

You do not need it for normal development — `db.sync()` creates missing tables
on boot.

## Authentication

Two ways in, both resolving to the same `req.user`:

1. **Email and password** — bcrypt-hashed, issued as a JWT in an httpOnly cookie.
2. **Auth0** — a Bearer token verified against Auth0's public key.

`requireAuth` (in `middleware/auth.js`) accepts either and protects every trip
route.

## Development

```bash
npm run dev     # nodemon, restarts on save
npm start       # plain node, no watching
```

`npm start` caches modules at boot, so edits are **not** picked up until you
restart. If a change seems to have no effect, check which one you are running.

## Deployment

* Set `DATABASE_URL` to the production database.
* Set `FRONTEND_URL` to the deployed frontend URL — exactly, with no trailing
  slash. CORS allows one origin, so a mismatch breaks every request.
* Add `MY_TRAVEL_BUDDY`, `VISA_API`, `JWT_SECRET`, and the Auth0 variables.
* Set `PORT` if the host requires it.
* **Set `NODE_ENV=production`.** Two things depend on it:
  * the auth cookie becomes `secure` + `SameSite=None`, which a frontend on a
    different domain needs — without it, login silently fails;
  * Postgres SSL turns on, which hosted databases require.
* Do not run `npm run seed` against production.

Never commit `.env` or API keys.

## Common Issues

| Problem | Solution |
| --- | --- |
| Server exits on start with "Missing …" | One of the five required variables is absent — see Environment Variables. |
| `ECONNREFUSED … 5432` | PostgreSQL is not running, or the port in `DATABASE_URL` is wrong. |
| Database does not exist | `createdb travel_buddy` — the name must match `DATABASE_URL`. |
| Frontend gets "Failed to fetch" | `FRONTEND_URL` does not match the browser's origin exactly (a different port counts). |
| Login works, then every call returns 401 | `AUTH0_AUDIENCE` and the frontend's `VITE_AUTH0_AUDIENCE` differ. |
| Code changes have no effect | You are running `npm start`; use `npm run dev`. |
| Gemini request fails | Check `MY_TRAVEL_BUDDY` and `GEMINI_MODEL`. |
| Visa responses say `source: "gemini"` | The visa API quota is exhausted; the fallback is doing its job. |
| Accounts and trips disappeared | Something ran `npm run seed`, which drops every table. |
| Port 8080 already in use | Stop the other process or set `PORT`. |

## Client

The React frontend lives in the separate **My Travel Buddy Client** repository
and runs locally at <http://localhost:5173>.
