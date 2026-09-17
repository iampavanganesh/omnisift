# ▶ Test the Auth backend (15 min, no Flutter needed)

You'll run the backend and hit register/login in your browser. That's the whole
goal of this step: see the new app *do something real*.

You already have a Supabase project — we'll point the backend at it.

## 1. Extract & open
Unzip into a NEW folder, e.g. `C:\Dev\Omnisift-v2` (keep it separate from your
old app). Open `omnisift/apps/backend` in VS Code.

## 2. Fill in `.env`
Copy `.env.example` to `.env`, then fill these from your Supabase dashboard:

| Variable | Where to get it (Supabase dashboard) |
|---|---|
| `DATABASE_URL` | Project → Connect → "Connection pooling" URI (port 6543) |
| `DIRECT_URL` | Project → Connect → "Direct connection" URI (port 5432) |
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role key (secret!) |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Secret |
| `SERPAPI_KEY` | your existing SerpAPI key (not needed for Auth, but fill it) |

## 3. Install & create the database tables
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init      # creates all 17 tables in your Supabase
npm run prisma:seed                      # adds SerpAPI + 4 sellers
```
(Optional but recommended) apply row-level security once:
```bash
psql "YOUR_DIRECT_URL" -f prisma/sql/enable_rls.sql
```

## 4. Run it
```bash
npm run start:dev
```
You should see: `Omnisift API listening on :3000`.

## 5. See it work
Open **http://localhost:3000/docs** in your browser (Swagger).

1. Expand **POST /api/v1/auth/register** → "Try it out" → enter:
   ```json
   { "fullName": "Test User", "email": "test@example.com", "password": "Test1234" }
   ```
   Execute → you get back `userId`, `accessToken`, `refreshToken`. ✅
2. Check your Supabase dashboard → Table Editor → `users` → your row is there. ✅
3. Try **POST /api/v1/auth/login** with the same email/password → tokens again. ✅

If those three work, the Auth backend is done and the whole foundation is proven.

## If something breaks
Copy the exact error and send it to me. Most likely culprits:
- `.env` value wrong/missing → the app prints exactly which one on startup.
- Migration can't connect → `DIRECT_URL` must be the port-5432 (direct) URI.
- Login fails "Incorrect email or password" → the register step didn't complete;
  re-run register first.
