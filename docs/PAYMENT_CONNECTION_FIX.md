# "Payments can't connect" — Fix

If you see **"Payments can't connect right now"** or **"Couldn't reach the payment server"**, the diner app cannot reach the API.

## Quick fix (local dev)

1. **Free port 3001 if needed** — If you see `EADDRINUSE: address already in use 0.0.0.0:3001`:
   ```bash
   lsof -i :3001 -t | xargs kill
   ```
   (Or close the other terminal/tab that’s already running the API.)

2. **Start the API and diner** — From repo root:
   ```bash
   npm run dev:pay
   ```
   This starts the API (port 3001) and diner (e.g. port 5173) together.

3. **Point diner to local API** — In `apps/diner/.env` (copy from `apps/diner/.env.example` if needed):
   ```
   VITE_API_URL=http://localhost:3001
   ```

4. **Restart if the diner was already running** — Stop it, then run `npm run dev:pay` again from repo root.

## Using the deployed API (Render)

If `VITE_API_URL` points to `https://drift-api-7vs7.onrender.com` (or similar):

- **Free tier sleeps** — The first request after inactivity can take 30–60 seconds. Use **Try again** if it times out.
- **Cold start** — The app now waits up to 60 seconds before timing out.

## Verify it works

1. Open http://localhost:5173/pay
2. Sign in
3. Enter amount and recipient
4. Add card if prompted
5. Send — it should connect to the API

If it still fails, check the browser console (F12 → Console) for the exact error.
