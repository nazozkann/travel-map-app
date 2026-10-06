# Explora

Discover, share and collect places on a map. Users drop pins, vote and comment on them, and group them into lists that others can follow or collaborate on.

- `client/` – React 19 + Vite + MapLibre GL
- `server/` – Express 5 + MongoDB (Mongoose), JWT auth
- `netlify/functions/` – thin wrappers that run `server/` as Netlify Functions

## Deployment (Netlify)

`netlify.toml` builds the client and serves the API from the same site under `/api/*` (no separate backend host, no CORS). In the Netlify site settings set these environment variables (scope: Builds + Functions):

- `MONGO_URL` – MongoDB Atlas connection string (Atlas Network Access must allow `0.0.0.0/0`, Netlify has no fixed IPs)
- `JWT_SECRET` – long random string
- `VITE_MAPTILER_API_KEY`, `VITE_GEOAPIFY_API_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`

Do **not** set `VITE_API_URL` there; the client then calls the API on its own origin. A daily scheduled function (`keepalive`) pings the database so a free Atlas cluster isn't paused for inactivity.

`server/index.js` still runs the API as a regular Node server (e.g. on Render) if you prefer that.

## Running locally

Requirements: Node 18+ and a MongoDB instance.

```bash
# API
cd server
cp .env.example .env    # set MONGO_URL and JWT_SECRET
npm install
npm run dev             # http://localhost:5000

# Web app (second terminal)
cd client
cp .env.example .env    # set VITE_API_URL and the MapTiler / Geoapify / Cloudinary keys
npm install
npm run dev             # http://localhost:5173
```

`npm run fix-categories` in `server/` fixes pins saved with the old misspelled category `accomodation` (add `-- --dry-run` to only count them).

`npm run update-cities` in `server/` backfills the `city` field of pins that are missing it (needs `GEOAPIFY_API_KEY`).

## Auth model

Every write endpoint requires `Authorization: Bearer <token>` (from `POST /api/auth/login`). The acting user always comes from the token; any `username` sent in a request body is ignored.
