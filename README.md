# PolyHub Monorepo

Phase 0 skeleton: `apps/web` (your existing React prototype, unchanged), `apps/api`
(new NestJS backend), `apps/ml` (new FastAPI ML service). See
`PolyHub_Production_Plan.md` (shared separately) for the full roadmap.

> **Note:** this was scaffolded in a sandboxed environment with no internet
> access, so `npm install` / `pip install` have **not** been run yet.
> Dependencies are declared correctly in `package.json` / `requirements.txt`
> — you just need to install them on your own machine. Steps below.

## 0. Prerequisites
- Node.js 20+
- Docker Desktop (for Postgres + Redis)
- Python 3.11+ (for the ML service)

## 1. Start local infrastructure

```bash
docker compose up -d
```

This starts:
- Postgres (with PostGIS) on `localhost:5432`
- Redis on `localhost:6379`
- Adminer (DB browser UI) on `localhost:8080`

## 2. Set up the API

```bash
cd apps/api
cp .env.example .env       # edit JWT_SECRET at minimum
npm install
npx prisma migrate dev --name init   # creates all tables from schema.prisma
npm run start:dev
```

API will be running at `http://localhost:4000`. Check it:

```bash
curl http://localhost:4000/health
```

Try registering a user:

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@polyhub.dev","password":"password123","name":"Test User","roles":["BUYER"]}'
```

## 3. Set up the web app (your existing prototype)

```bash
cd apps/web
npm install
npm run dev
```

Runs on `http://localhost:5173` (Vite default) — nothing has been changed
here yet, it's still the prototype pointed at mock data. Wiring it to the
real API is the next step after this.

## 4. Set up the ML service

```bash
cd apps/ml
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check it:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/estimate/print-job \
  -H "Content-Type: application/json" \
  -d '{"volume_mm3": 15000, "material": "PLA", "infill_percent": 20}'
```

That estimate endpoint is a placeholder heuristic, not a trained model yet
— see the production plan §7.1 for when the real model replaces it.

## What's real vs. stubbed right now

| Piece | Status |
|---|---|
| DB schema (`prisma/schema.prisma`) | Real — implements the full data model from the plan |
| Auth (register/login/JWT/roles) | Real, working end-to-end once you run migrations |
| Health checks (API + ML) | Real |
| Print time/cost estimator | Stub heuristic — real model comes in Phase 3 |
| Web app | Unchanged prototype — still uses mock data |
| Catalog, Orders, Payments, Matching modules | Not built yet — next steps |

## Known gaps to close before this is "Phase 0 done"

1. `PrinterProfile.latitude/longitude` need an actual PostGIS `geography`
   column + spatial index for real geo-matching — currently plain floats as
   a placeholder (Prisma doesn't model PostGIS types natively). Add via a
   raw SQL migration once the Matching module is being built.
2. No tests yet — add Jest specs for `AuthService` before building more on
   top of it.
3. No CI workflow yet (`.github/workflows/ci.yml`) — worth adding once
   there's more than one contributor pushing to this repo.
