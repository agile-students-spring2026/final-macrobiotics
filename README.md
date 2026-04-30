# Milely

Milely is a React and Express app for searching award flight availability, viewing trip details, and managing saved flights and account preferences.

The app is split into two npm projects:

- `front-end`: React 18 app served by Vite.
- `back-end`: Express API with MongoDB persistence, optional Redis caching, and Seats.aero partner API integration.

## Prerequisites

- Node.js `20.19.0` or newer in the Node 20 line, or Node.js `22.12.0` or newer.
- npm, included with Node.js.
- A MongoDB connection string. A local MongoDB instance or MongoDB Atlas connection both work.
- A Seats.aero partner API key for live flight search.
- Optional: Redis, if you want search result caching and the prefetch worker to persist cached results.

## Environment Variables

Create a `.env` file in the repository root. The backend loads environment variables from `back-end/.env` or the root `.env`; keeping one root file is the simplest setup.

```env
MONGO_URI=mongodb://127.0.0.1:27017/milely
SEATS_AERO_API=your_partner_api_key_here
JWT_SECRET=replace_with_a_long_random_secret

# Optional
REDIS_URL=redis://127.0.0.1:6379
```

Variable notes:

- `MONGO_URI` is required. The backend will not start without it.
- `SEATS_AERO_API` is required for live search and trip detail endpoints.
- `JWT_SECRET` is optional for local development, but should be set for any shared or deployed environment.
- `REDIS_URL` is optional. If omitted, the API still runs without caching.

If your frontend needs to call a backend URL other than `http://localhost:3000`, create `front-end/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Install Dependencies

Install dependencies separately for the backend and frontend.

```bash
cd back-end
npm install

cd ../front-end
npm install
```

On Windows PowerShell, use the same commands.

## Run the Backend

Start MongoDB first, then start the API in one terminal:

```bash
cd back-end
npm start
```

The API runs at `http://localhost:3000`.

Useful checks:

- Open `http://localhost:3000/` and expect `API route reached successfully`.
- If Redis is not configured, startup may still succeed; Redis is optional.
- If startup fails with `MONGO_URI is not configured on the backend.`, check that `.env` exists and includes `MONGO_URI`.

## Run the Frontend

With the backend still running, open a second terminal:

```bash
cd front-end
npm run dev
```

Open the Vite URL shown in the terminal. By default it is `http://localhost:5173`.

The backend currently allows browser requests from `http://localhost:5173`. If Vite starts on another port because `5173` is busy, stop the other process or update the backend CORS origin before using the app in the browser.

## Local Development Flow

1. Start MongoDB.
2. Optional: start Redis.
3. Start the backend from `back-end` with `npm start`.
4. Start the frontend from `front-end` with `npm run dev`.
5. Use the app at `http://localhost:5173`.

Both servers need to run at the same time for login, signup, search, bookmarks, and settings to work.

## Run with Docker

Docker Compose can run the frontend, backend, MongoDB, and Redis together in Linux containers.

1. Copy the Docker environment template:

```bash
cp .env.docker.example .env.docker
```

On Windows PowerShell:

```powershell
Copy-Item .env.docker.example .env.docker
```

2. Edit `.env.docker` and set real values for:

```env
SEATS_AERO_API=your_partner_api_key_here
JWT_SECRET=replace_with_a_long_random_secret
```

3. Build and start the full stack:

```bash
docker compose --env-file .env.docker up --build
```

4. Open the app at `http://localhost:8080`.

The backend is also exposed at `http://localhost:3000`, MongoDB at `localhost:27017`, and Redis at `localhost:6379`.

Useful Docker commands:

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker down
```

To remove the MongoDB and Redis Docker volumes as well:

```bash
docker compose --env-file .env.docker down -v
```

## Test and Build

Run backend tests:

```bash
cd back-end
npm test
```

Build the frontend production bundle:

```bash
cd front-end
npm run build
```

Preview the production frontend build:

```bash
cd front-end
npm run preview
```
