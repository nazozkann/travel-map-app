# Explora

Discover, share and collect places on a map. Users drop pins, vote and comment on them, and group them into lists that others can follow or collaborate on.

- `client/` – React 19 + Vite + MapLibre GL
- `server/` – Express 5 + MongoDB (Mongoose), JWT auth

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

`npm run update-cities` in `server/` backfills the `city` field of pins that are missing it (needs `GEOAPIFY_API_KEY`).

## Auth model

Every write endpoint requires `Authorization: Bearer <token>` (from `POST /api/auth/login`). The acting user always comes from the token; any `username` sent in a request body is ignored.
