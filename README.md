# My Travel Buddy — Server

My Travel Buddy is a Node.js and Express backend that connects to PostgreSQL through Sequelize.

The server handles user authentication, saved trips, activities, checklist items, AI-generated itineraries using Gemini, and visa requirement requests.

## Getting Started

Install the dependencies:

```bash
npm install
```

Create your local database:

```bash
createdb capstone_dev
```

Create your `.env` file:

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

You should see messages similar to:

```text
🐘 Database connection established.
🧩 Models synced.
🚀 Server is running on PORT: 8080
```

## Environment Variables

Configure the required environment variables in your `.env` file.

```env
PORT=8080
DATABASE_URL=
FRONTEND_URL=http://localhost:5173

MY_TRAVEL_BUDDY=
GEMINI_MODEL=

VISA_API=

JWT_SECRET=
```

Use the exact values and variable names required by your local environment.

## Tech Stack

* Node.js
* Express.js
* PostgreSQL
* Sequelize
* bcrypt
* JSON Web Tokens
* Gemini API
* Travel Buddy Visa API

## Project Structure

```text
app.js
db/
  index.js

models/
  index.js
  user.model.js
  trip.model.js
  activity.model.js
  checklist.model.js

routes/
  auth.routes.js
  trips.routes.js
  activity.routes.js
  checklist.routes.js
  ai.routes.js
  visa.routes.js

middleware/
  requireAuth.js
```

## Main API Routes

| Method | Path                                    | Purpose                           |
| ------ | --------------------------------------- | --------------------------------- |
| POST   | `/auth/signup`                          | Create a user account             |
| POST   | `/auth/login`                           | Log in                            |
| GET    | `/auth/me`                              | Get the currently logged-in user  |
| GET    | `/trips`                                | Get saved trips                   |
| POST   | `/trips`                                | Create a trip                     |
| GET    | `/trips/:id`                            | Get one trip                      |
| POST   | `/trips/:id/activities`                 | Add an activity to a trip         |
| DELETE | `/trips/:tripId/activities/:activityId` | Delete an activity                |
| POST   | `/trips/itinerary`                      | Generate an itinerary with Gemini |
| POST   | `/trips/visa`                           | Check visa requirements           |

## AI Itinerary Generation

The server uses the Gemini API to generate personalized travel itineraries.

The frontend sends information such as:

```json
{
  "destination": "Kyoto, Japan",
  "startDate": "2026-08-15",
  "endDate": "2026-08-20",
  "budget": "1500",
  "interests": [
    "Food",
    "Culture",
    "Sightseeing"
  ]
}
```

Gemini returns structured JSON containing:

* Trip summary
* Activities
* Activity dates and times
* Activity categories
* Estimated costs
* Notes
* Travel checklist

Activity categories are restricted to:

```text
Food
Sightseeing
Culture
Adventure
Shopping
Transportation
Entertainment
Other
```

The Gemini response schema ensures the AI output matches the structure expected by the frontend and database.

## Visa Requirements

The server also connects to the Travel Buddy API to retrieve visa information.

Example request:

```http
POST /trips/visa
```

Example body:

```json
{
  "passportCode": "US",
  "destinationCode": "CN"
}
```

The external API key is stored in:

```env
VISA_API=
```

## Database

PostgreSQL is used to store application data.

Sequelize manages the database models and relationships.

Main application data includes:

* Users
* Trips
* Activities
* Checklist items
* User-trip relationships

## Authentication

Authentication protects user-specific trip information.

Passwords are securely hashed with `bcrypt`.

Protected routes verify the authenticated user before allowing access to saved trips and related data.

## Development

Start the server with automatic restart:

```bash
npm run dev
```

Start without automatic restart:

```bash
npm start
```

## Deployment

For deployment:

* Set `DATABASE_URL` to the production PostgreSQL database.
* Set `FRONTEND_URL` to the deployed React frontend.
* Add the Gemini API key.
* Add the Travel Buddy Visa API key.
* Add the authentication secret.
* Set `PORT` if required by the hosting provider.

Never commit the `.env` file or API keys to GitHub.

## Common Issues

| Problem                  | Solution                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| `ECONNREFUSED ... 5432`  | Make sure PostgreSQL is running and the local database exists.            |
| Database does not exist  | Run `createdb capstone_dev`.                                              |
| Gemini request fails     | Check `MY_TRAVEL_BUDDY` and `GEMINI_MODEL` in `.env`.                     |
| Visa request fails       | Check the `VISA_API` environment variable.                                |
| Port 8080 already in use | Stop the existing server process or use another port.                     |
| Frontend cannot connect  | Confirm `FRONTEND_URL` and the frontend API URL are configured correctly. |

## Client

The React frontend normally runs locally at:

```text
http://localhost:5173
```

The backend normally runs locally at:

```text
http://localhost:8080
```
