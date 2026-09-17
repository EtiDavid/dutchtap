# DutchTap

A tiny, polished Dutch grammar memory trainer. Three tap-based modes —
**de/het**, **deze/dit/die/dat**, and **adjective endings** — sharing one
noun bank, with a spaced-repetition engine that keeps bringing missed
words back until they're automatic.

Play as a guest (progress saved on-device) or create a username/password
account (no email — a one-time recovery code is your password reset
method) to sync progress across devices.

## Local setup

Requirements: Node.js 20+, a MongoDB Atlas connection string.

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and SESSION_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Guest mode works
immediately with no database; account features need `MONGODB_URI`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit/integration tests (Vitest) — pure grammar/mastery logic, content validation, auth primitives |
| `npm run test:e2e` | End-to-end tests (Playwright) — runs against a real dev server **and the real MongoDB Atlas database** in `MONGODB_URI`; creates and deletes its own `e2e_`-prefixed accounts |
| `npm run test:coverage` | Vitest with coverage |

## Environment variables

See [.env.example](.env.example). Only two are used:

- `MONGODB_URI` — Atlas connection string, including a database name.
- `SESSION_SECRET` — random string used to sign session cookies (generate
  with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit together
- [docs/CONTENT_AUDIT.md](docs/CONTENT_AUDIT.md) — noun/adjective bank verification
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Atlas + custom domain steps

## Tests

83 unit tests (Vitest) cover the grammar engine, the mastery/repetition
engine, content validation, and auth primitives — all pure logic, no
network. 7 end-to-end tests (Playwright) exercise the real app in a real
browser against the real database: guest play, the wrong-word repetition
contract, all four demonstrative forms, adjective base/-e grading, and
the full account lifecycle (register, recovery code, guest-progress
merge, logout, login, password reset).
