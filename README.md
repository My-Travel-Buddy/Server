# My Travel Buddy — Server

The backend for **My Travel Buddy**, a PERN travel-planning application.

The server uses **Node.js**, **Express**, **PostgreSQL**, and **Sequelize**. It provides routes for trips, activities, checklist items, authentication, and AI-generated itineraries using the Gemini API.

---

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Sequelize
- Gemini API (`@google/genai`)
- JWT authentication
- Auth0 support
- bcrypt
- CORS
- Helmet
- Morgan
- Express Rate Limit

---

## Server Structure

```text
Server/
├── db/
│   └── index.js
│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── Activity.js
│   ├── checklist.js
│   ├── index.js
│   ├── Trip.js
│   └── User.js
│
├── public/
│
├── routes/
│   ├── activities.js
│   ├── ai.routes.js
│   ├── auth.routes.js
│   ├── checklist.routes.js
│   ├── index.js
│   └── trips.js
│
├── .env
├── .gitignore
├── app.js
├── package-lock.json
├── package.json
├── README.md
└── seed.js
```

---

## Main Responsibilities

| File | Responsibility |
| --- | --- |
| `app.js` | Creates the Express app, applies middleware, mounts routes, connects to the database, and starts the server |
| `db/index.js` | Sequelize/PostgreSQL database connection |
| `middleware/auth.js` | Authentication helpers and middleware |
| `models/User.js` | User model |
| `models/Trip.js` | Trip model |
| `models/Activity.js` | Activity model |
| `models/checklist.js` | Checklist model |
| `models/index.js` | Model exports and associations |
| `routes/index.js` | Collects the main routers |
| `routes/trips.js` | Trip CRUD |
| `routes/activities.js` | Activity CRUD |
| `routes/checklist.routes.js` | Checklist CRUD |
| `routes/ai.routes.js` | Gemini itinerary generation |
| `routes/auth.routes.js` | Signup, login, logout, Auth0 sync, and current-user routes |
| `seed.js` | Database seed/setup data |

---

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file with the environment variables required by the server.

Then start the development server:

```bash
npm run dev
```

For a normal start without Nodemon:

```bash
npm start
```

The server uses port `8080` by default unless `PORT` is provided in `.env`.

You should see output similar to:

```text
🐘 Database connection established.
🧩 Models synced.
🚀 Server is running on PORT: 8080
```

---

## Environment Variables

The current server code uses environment variables including:

```env
PORT=8080
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

MY_TRAVEL_BUDDY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite

DATABASE_URL=your_database_url

JWT_SECRET=your_jwt_secret
AUTH0_DOMAIN=your_auth0_domain
AUTH0_AUDIENCE=your_auth0_audience
```

Do not commit the real `.env` file or API keys to GitHub.

---

## Health Check

### GET `/check`

Confirms that the Express server is running.

Example response:

```json
{
  "status": "ok",
  "uptime": 120.5
}
```

---

## Public Test Route

### GET `/api/public`

Simple public endpoint used to confirm that the API is reachable.

Example response:

```json
{
  "message": "👋🏽 Hi, you found this public route!"
}
```

---

## Protected Test Route

### GET `/api/protected`

Uses `requireAuth`.

A valid authenticated request returns information about the logged-in user.

Example:

```json
{
  "message": "🔒 Your token is valid — you reached a protected route!",
  "userId": "USER_ID",
  "username": "username",
  "via": "password"
}
```

The `via` value can indicate password authentication or Auth0 authentication.

---

# API Routes

## AI Itinerary

The AI router is currently mounted at:

```text
/api/ai
```

### POST `/api/ai/itinerary`

Generates an itinerary using Gemini.

Example request:

```json
{
  "destination": "Kyoto, Japan",
  "startDate": "2026-09-10",
  "endDate": "2026-09-13",
  "budget": 1200,
  "interests": ["Food", "Culture"]
}
```

Gemini is instructed to return:

```json
{
  "summary": "Trip summary",
  "activities": [
    {
      "title": "Activity title",
      "category": "Culture",
      "estimatedCost": 25,
      "notes": "Activity notes"
    }
  ]
}
```

The server validates the shape of the Gemini response through the response schema defined in `routes/ai.routes.js`.

---

## Trips

The trips router is currently mounted at:

```text
/trips
```

### GET `/trips`

Returns all trips.

### GET `/trips/:id`

Returns one trip by ID and includes its checklist and activities.

### POST `/trips/post`

Creates a new trip.

Expected fields:

```json
{
  "destination": "Kyoto, Japan",
  "date_Range": [],
  "budget": []
}
```

### PATCH `/trips/:id/edit`

Updates an existing trip.

### DELETE `/trips/:id/delete`

Deletes a trip.

The current delete logic also removes associated:

- Activities
- Checklist items
- `User_Trip` records

The delete operation uses a Sequelize transaction.

---

## Activities

The activity router is also mounted under:

```text
/trips
```

### GET `/trips/:tripId/activities`

Returns activities for one trip.

### GET `/trips/:tripId/activities/:activityId`

Returns one activity.

### POST `/trips/:tripId/activities`

Creates an activity for a trip.

Expected fields:

```json
{
  "title": "Fushimi Inari Shrine",
  "category": "Sightseeing",
  "dateTime": "2026-09-10T10:00:00",
  "estimatedCost": 0,
  "notes": "Explore the torii gates."
}
```

### PATCH `/trips/:tripId/activities/:activityId`

Updates an activity.

### DELETE `/trips/:tripId/activities/:activityId`

Deletes an activity.

---

## Checklist

The checklist router is mounted under:

```text
/trips
```

### POST `/trips/:tripId/checklist/post`

Creates a checklist item for a trip.

### PATCH `/trips/:tripId/:id/checklist/edit`

Updates a checklist item.

### DELETE `/trips/:id/checklist/delete`

Deletes a checklist item.

Some checklist GET routes are currently commented out in `routes/checklist.routes.js`.

The checklist route also currently contains a temporary hard-coded `UserId`, so that part still needs to be connected to the authenticated user.

---

# Authentication

`routes/auth.routes.js` contains the authentication logic for:

### POST `/auth/signup`

Creates a user with:

- username
- email
- password

The password is hashed with bcrypt before being stored.

### POST `/auth/login`

Allows login with either:

- email
- username

A successful login sets a JWT cookie.

### POST `/auth/logout`

Clears the JWT cookie.

### POST `/auth/auth0`

Synchronizes an authenticated Auth0 user with the local users table.

### GET `/auth/me`

Returns the current authenticated user.

The authentication middleware supports either:

- the application's JWT cookie
- an Auth0 Bearer token

> **Current integration note:** `auth.routes.js` contains these routes, but in the provided `app.js` the line that mounts the authentication router is currently commented out:
>
> ```js
> // app.use('/auth', authRouter);
> ```
>
> Also, the provided `routes/index.js` does not currently export `authRouter`. Authentication routes will not be reachable until those two pieces are connected.

---

## Middleware and Security

The server currently uses:

- `helmet()` for safer HTTP headers
- `cookie-parser` for cookies
- `cors()` for frontend/backend communication
- `morgan('dev')` for request logging
- `express.json({ limit: '10kb' })` for JSON request bodies
- `express-rate-limit` for request limiting

The general rate limit is:

```text
Production: 100 requests per 15 minutes per IP
Development: 1000 requests per 15 minutes per IP
```

Authentication routes also define a tighter login/signup limiter:

```text
20 attempts per 15 minutes per IP
```

---

## Database Startup

The server starts only after successfully connecting to PostgreSQL.

The startup flow is:

```text
db.authenticate()
→ db.sync()
→ app.listen()
```

`db.sync()` creates missing tables based on the Sequelize models.

The server intentionally does not use:

```js
sync({ force: true })
```

inside `app.js` because that would delete tables on startup.

---

## Scripts

From `package.json`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server with Nodemon |
| `npm start` | Start the server with Node |
| `npm run seed` | Run the configured seed script |

Current package configuration:

```json
{
  "dev": "nodemon app.js",
  "start": "node app.js",
  "seed": "node db/seed.js"
}
```

> **Check before using `npm run seed`:** the provided project structure shows `seed.js` at the Server root, while `package.json` currently points to `db/seed.js`. These should match.

---

## Current MVP Backend

The current backend supports the main My Travel Buddy MVP areas:

```text
Users
Trips
Activities
Checklist Items
AI Itinerary Generation
Authentication
```

The React frontend can use these routes to:

```text
Guest enters trip information
→ AI generates itinerary
→ User logs in/signs up when needed
→ Trip is saved
→ User opens saved trips
→ User manages activities
→ User manages checklist items
```

---

## Current Integration Notes

The code provided shows a few areas that are still being connected:

1. `auth.routes.js` exists, but the auth router is not currently mounted in `app.js`.
2. `routes/index.js` currently exports trips, checklist, activities, and AI routers, but not `authRouter`.
3. Some checklist GET routes are commented out.
4. Checklist creation currently uses a temporary hard-coded `UserId`.
5. The `npm run seed` path in `package.json` should be checked against the actual location of `seed.js`.

These are implementation notes, not additional architecture requirements. The project can stay with the current simple TTP folder structure.
