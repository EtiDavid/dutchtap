# DutchTap

A tiny, polished Dutch memory trainer. **Flashcards**: study a fixed set of
everyday sentences, say them from memory with a self-rating, and quiz yourself
on the same set by putting the words in order. Plus three tap-based grammar
modes — **de/het**, **deze/dit/die/dat**, and **adjective endings** — sharing
one noun bank, with a spaced-repetition engine that keeps bringing missed words
back until they're automatic.

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

### Or run it in a container

```bash
docker build -t dutchtap:local .
docker run -d --name dutchtap-local -p 3001:3000 --env-file .env.local dutchtap:local
```

Open [http://localhost:3001](http://localhost:3001). The image is a
multi-stage build using Next.js's `output: "standalone"` mode (see
`next.config.ts`) — no real env vars are needed at build time, only at
`docker run`. Stop it with `docker rm -f dutchtap-local`.

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
| `npm run test:flashcards` | Isolated browser tests for sessions (account endpoints served in memory, never Atlas). Set `E2E_PORT=3100` if port 3000 is taken |
| `npm run test:sessions-db` | Session server logic against a real **local** MongoDB (`docker run -d -p 127.0.0.1:27018:27017 mongo:7`); refuses non-local databases |
| `npm run test:prod` | Builds the app and checks the production service worker |
| `npm run assets:flashcards -- --complete` | Confirms all 600 pictures and recordings exist |

## Environment variables

See [.env.example](.env.example). Only two are used:

- `MONGODB_URI` — Atlas connection string, including a database name.
- `SESSION_SECRET` — random string used to sign session cookies (generate
  with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit together
- [docs/CONTENT_AUDIT.md](docs/CONTENT_AUDIT.md) — noun/adjective bank verification
- [docs/FLASHCARDS.md](docs/FLASHCARDS.md) — sessions, flashcards, quiz, levels and audio generation
- [docs/STAGE-1-HANDOVER.md](docs/STAGE-1-HANDOVER.md) — session engine, API and storage contracts, rules, tests, how to add content
- [docs/FRENCH-HANDOVER.md](docs/FRENCH-HANDOVER.md) — French as a second learning language: scope, data, review status, speech limits, tests
- [docs/french/REVIEW-TABLE.md](docs/french/REVIEW-TABLE.md) — review table for all 600 French cards
- [docs/GRAMMAR-COVERAGE.md](docs/GRAMMAR-COVERAGE.md) — which practised grammar patterns the first 300 sentences cover (not yet re-audited for the 600), gaps and proposals
- [docs/word-assets/CHATGPT-INSTRUCTIONS.md](docs/word-assets/CHATGPT-INSTRUCTIONS.md) — adding pictures and sounds to words
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Atlas + custom domain steps

## Tests

Hundreds of unit tests (Vitest) cover the grammar engine, the mastery engine, content validation, auth primitives, the session engine and
server logic, the client store (offline, replay, several devices) and the service worker, all as pure logic with no network. Browser tests
(Playwright) exercise sessions end to end without touching Atlas; a separate Atlas-backed suite (`npm run test:e2e`) covers the grammar games and
the account lifecycle. See [docs/STAGE-1-HANDOVER.md](docs/STAGE-1-HANDOVER.md) section 11 for exactly what runs and what does not.
