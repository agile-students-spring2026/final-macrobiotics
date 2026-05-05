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

## Deployment Link 

The deployed web application can be accessed at the following link: [Miely](http://142.93.49.130:8080/)

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

Docker Compose can run the frontend and backend together in Linux containers. MongoDB and Redis are expected to run externally, using the same connection strings as the non-Docker setup.

1. Install Docker and Docker Compose.

On Docker Desktop, Compose is included. On Ubuntu, install Docker and the Compose plugin:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

2. Copy the environment template:

```bash
cp .env.docker.example .env
```

3. Edit `.env` and set real values for:

```env
SEATS_AERO_API=your_partner_api_key_here
JWT_SECRET=replace_with_a_long_random_secret
MONGO_URI=your_external_mongodb_connection_string
REDIS_URL=your_external_redis_connection_string
CORS_ORIGIN=http://localhost:8080
```

4. Build and start the full stack:

```bash
docker-compose up --build -d
```

If your machine has the modern Docker Compose plugin, this also works:

```bash
docker compose up --build -d
```

5. Open the app at `http://localhost:8080`.

The backend is also exposed at `http://localhost:3000`.

Useful Docker commands:

```bash
docker-compose ps
docker-compose logs -f backend
docker-compose down
```

## Deploy on DigitalOcean

These steps deploy the Docker Compose stack to a single DigitalOcean Droplet.

1. Create a Droplet using Ubuntu or DigitalOcean's Docker image.
2. Add inbound firewall rules for:
   - SSH on TCP `22`
   - the web app on TCP `8080`
3. SSH into the Droplet:

```bash
ssh root@your_droplet_ip
```

4. Clone the repository and switch to the Docker branch:

```bash
git clone https://github.com/agile-students-spring2026/final-macrobiotics.git
cd final-macrobiotics
git checkout docker
```

5. If Docker Compose is not already installed, install it:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

These instructions use `docker-compose`, which is available on many DigitalOcean Docker images. If `docker-compose version` does not work, install the Compose plugin above and use `docker compose` instead.

6. Create the production env file:

```bash
cp .env.docker.example .env
nano .env
```

Set:

```env
SEATS_AERO_API=your_real_partner_api_key
JWT_SECRET=replace_with_a_long_random_secret
MONGO_URI=your_external_mongodb_connection_string
REDIS_URL=your_external_redis_connection_string
CORS_ORIGIN=http://your_droplet_ip:8080
```

Save and exit nano with `Ctrl+O`, `Enter`, then `Ctrl+X`.

7. Start the app:

```bash
docker-compose up --build -d
```

8. Check the containers:

```bash
docker-compose ps
```

Expected ports:

```text
frontend   0.0.0.0:8080->80/tcp
backend    0.0.0.0:3000->3000/tcp
```

9. Open the app:

```text
http://your_droplet_ip:8080
```

If the page does not load, verify the container and firewall:

```bash
docker-compose ps
sudo ss -tulpn | grep 8080
curl -I http://localhost:8080
```

If the backend is unhealthy, confirm the Droplet can reach the external MongoDB and Redis endpoints configured in `.env`.

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
