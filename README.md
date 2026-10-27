# DutchTap

DutchTap is a **Dutch and French sentence-learning app**, with real-world situations, persistent flashcard sessions and quick Dutch grammar games. Learn through **Study → Speaking (self-rated) → Word-order Quiz**, or use the older Dutch Learning Hub for sentence building, verb forms and typed exercises. New cards start Difficult; sessions keep a fixed selection across modes.

**App:** https://dutchtap.davideti.dev  
**Important:** PR #15 **merged into main on 26 October 2026** with a *partial* Grammar Mastery foundation, not the completed curriculum. It did NOT automatically deploy: production requires a separate version-tagged release. Handover documentation currently lives on the continuation feature branch until a separate documentation PR is merged.

## What was merged into `main` vs what is still unfinished?

| Feature | On `main` after merged PR #15 | Outstanding Grammar Mastery work |
| --- | --- | --- |
| Dutch Core and French | 600 Everyday + 600 Dutch at Work + 600 separate French Everyday cards | Preserve all IDs, assets, progress and independent language state |
| Existing sessions and games | Fixed-card sessions, Study/Speaking/Quiz, de/het and demonstrative/adjective games | Full migration, offline and account-sync regression testing |
| Grammar base cards | **765 authored + 120 reviewed source aliases = 885 playable grammar base cards across 13 topics** | Larger meaningful topic coverage, complete review and advanced topics |
| Topic-wide lessons | Four expanded v1.0 guides, the Als, Toen, Wanneer and Separable guides at v1.1, three foundational v0.8, two introductory v0.2 | Complete all lessons with accurate, accessible reasons and examples |
| Individual sentence explanations | Initial grammar notes and limited ALS clause view | Bespoke, validated full structured word-order analysis for all grammar base cards |
| Dutch-first speaking | **569/765** authored grammar cards include Dutch prompts | Remaining 196 authored and 120 aliases need real Dutch-first scenarios; uncued mixed retrieval |
| Recognised alternatives | 58 new ALS authored cards provide two clause-order models | Explicit semantic validation and alternatives throughout other topics |
| Extra grammar variations | **100** children across ten ALS parent families | Author and validate meaningful independent children where pedagogically justified |
| Separable verbs | **68** distinct verb records with a forms table; **176** practice cards | Independent verification of every form and preposition; dedicated verb dictionary view |
| Mastery and complete release | Legacy/grammar level records and focused tests | Multi-topic skill tracking, full acceptance A01–A25, content QA, security and release checks |

**Audit and status:** [Grammar Mastery acceptance audit](docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md), [master implementation plan](docs/GRAMMAR-MASTERY-MASTER-PLAN.md), [development work log](docs/GRAMMAR-MASTERY-WORKLOG.md), and [Grammar Patterns guide](docs/GRAMMAR-PATTERNS.md). The master plan's dated `NOT STARTED` heading is the original frozen baseline, **not the live implementation status**. The acceptance audit is the current evidence-based status.

**Release status:** Grammar Mastery is **PARTIALLY COMPLETE**. [PR #15](https://github.com/EtiDavid/dutchtap/pull/15) was merged into main, but that Git merge is NOT a full-spec acceptance or production deployment. Missing topic depth, card analyses, Dutch prompts, variations, independent review, compatibility testing and security triage remain explicitly open. Further incomplete Grammar Mastery changes are not approved to merge or tag for production without the remaining acceptance gates. Do not represent five passing focused Chromium tests as the complete browser suite.

## Claude Code continuation and teaching-quality instructions

The project owner may delegate further implementation to Claude Code instead of using a long interactive ChatGPT session. **Read the full [Claude Code implementation handover](docs/CLAUDE-CODE-GRAMMAR-MASTERY-HANDOVER.md) and [worked teaching exemplars](docs/CLAUDE-GRAMMAR-TEACHING-EXEMPLARS.md)** before editing content. The root [CLAUDE.md](CLAUDE.md) automatically directs Claude Code to the approved plan, pedagogy contract and living acceptance audit. PR #15 is merged; the continuation feature branch contains additional handover documentation not yet in main, which must be reconciled without duplicating already-merged implementation changes.

These instructions enforce detailed, non-generic why-first explanations, realistic Dutch-first scenarios, sentence-specific analysis, answer alternatives, review provenance, test evidence, stable progress and no production deployment without owner approval.

## How to start learning on the current live app

1. Open https://dutchtap.davideti.dev and choose Nederlands. Guest progress stays on that device; a registered account can sync supported session progress.
2. Open **Practise** to create a fixed-card session in Everyday, Dutch at Work, or the released Grammar Patterns section. Review a sentence in Study first.
3. In Speaking, say your answer before revealing it. Select Difficult/Medium/Easy/Mastered **based on what you actually recalled**. The app does not automatically evaluate pronunciation.
4. In Quiz, build an answer with word tiles. The **Learning Hub** at `/learn` additionally provides Dutch-first Think in Dutch, sentence construction, and typed practice.
5. Avoid relying on unfinished development-branch lessons until an approved production release has been tagged.

## Local setup

Requirements: Node.js 20+, npm; a MongoDB Atlas URI for **account** functions. Guest mode works without database connectivity.

```bash
npm ci
cp .env.example .env.local  # supply MONGODB_URI and SESSION_SECRET for account features
npm run dev
```

Open http://localhost:3000. Follow `AGENTS.md` and the installed Next.js 16 docs before changing framework behavior.

### Docker

```bash
docker build -t dutchtap:local .
docker run -d --name dutchtap-local -p 3001:3000 --env-file .env.local dutchtap:local
```

Open http://localhost:3001. The image uses Next.js standalone output. Stop it with `docker rm -f dutchtap-local`. Keep real secrets out of Git.

## Commands and test limitations

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm run build` / `npm run start` | Development, production build, production server |
| `npm run lint` / `npx next typegen` / `npx tsc --noEmit` | Static checks |
| `npm test` | Vitest unit/integration tests; optional database tests are skipped without a test MongoDB |
| `npm run test:flashcards` | Isolated Playwright browser tests with a development server; app/account endpoints can be mocked |
| `npm run test:e2e` | Separate E2E suite using **real MongoDB Atlas** and test accounts; avoid production credentials |
| `npm run test:sessions-db` | Local-only session MongoDB verification (port 27018) |
| `npm run test:prod` | Production service worker/offline browser checks |
| `npm run content:workplace` | Check generated Dutch at Work content |
| `npm run content:learning-check` | Validate Learning Hub content |
| `npm run content:audit` / `npm run content:review-check` | Inventory the existing editorial review queue; **the latter is an independent gate**, not covered by normal CI |
| `npm run grammar:release-gate` | **Expected to FAIL while A01–A25 are incomplete.** Reads the audit matrix and blocks any claim that the feature is release-approved |
| `python3 scripts/build-grammar-patterns.py` | Regenerate grammar-pattern cards and notes from canonical sources |
| `npm run assets:flashcards -- --complete` | Check pictures and recordings for the original Everyday deck |

**Last scoped CI evidence:** [Grammar feature validation run 40367520391](https://github.com/EtiDavid/dutchtap/actions/runs/40367520391) passed 346 Vitest tests (seven skipped) and five focused Chromium tests, including a guest-session variation toggle and reload scenario. This does **not** establish a completed 25-item master-plan audit or production readiness. Use the latest PR checks for the current head SHA.

## Account and deployment safety

- Guest session data is local to the device. A username/password account uses a one-time recovery code instead of email recovery. Keep your recovery code safe.
- `.env.example` describes the required secrets: `MONGODB_URI` and `SESSION_SECRET`.
- **Vercel Git auto-deploy is disabled.** Production releases require a pushed `v*` tag pointing to an approved `main` commit and the required deployment workflow secrets. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- Do not merge a draft grammar PR or trigger a production tag merely because one CI workflow passes. Follow the full [release gates](docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md).

## Further documentation

- [Architecture](docs/ARCHITECTURE.md) and [Stage 1 session handover](docs/STAGE-1-HANDOVER.md)
- [Grammar Patterns guide](docs/GRAMMAR-PATTERNS.md) and [source reuse decisions](docs/GRAMMAR-REUSE-DECISION.md)
- [Grammar source audit](docs/GRAMMAR-SOURCE-AUDIT.md) — dated early inventory, not a substitute for the current acceptance matrix
- [Learning Hub and editorial review](docs/learning/README.md) — first-release snapshot; see current review hashes/scripts for up-to-date status
- [French content handover](docs/FRENCH-HANDOVER.md) and [French review table](docs/french/REVIEW-TABLE.md)
- [Deployment/rollback](docs/DEPLOYMENT.md)
