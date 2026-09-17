# Architecture

## Stack

Next.js App Router (TypeScript, React 19), Tailwind CSS v4, MongoDB
Atlas, HTTP-only signed-cookie sessions (no third-party auth provider).

## Directory layout

```
app/            routes (pages + API route handlers)
components/     UI, grouped by feature (game, home, account, stats, ui)
lib/
  grammar/      pure grammar rules — article, demonstrative, adjective
  mastery/      pure spaced-repetition/mastery engine
  game/         wires grammar + mastery + content into question generation
  auth/         password/recovery-code hashing, session cookies, lockout
  db/           MongoDB client, typed collections
  sync/         guest localStorage persistence + guest<->account merge
  stats/        overview/detailed stats computation
  validation/   Zod schemas for every API input
data/           the noun and adjective banks (version-controlled, not DB)
tests/          Vitest unit tests
tests/e2e/      Playwright end-to-end tests
```

## Why the vocabulary isn't in MongoDB

The noun/adjective bank (`data/nouns.ts`, `data/adjectives.ts`) is
static TypeScript data bundled with the app, not queried from the
database. It's read-only, small (few hundred KB), and every game
question needs it — putting it in Mongo would mean a network round trip
on the hot path for no benefit. MongoDB stores only what's actually
per-user: `users`, `progress`, `sessions`.

## Grammar engine (`lib/grammar`)

Three pure functions decide every correct answer:

- `getArticleAnswer(noun, isPlural)` — de/het, with all plurals forced to de.
- `getDemonstrativeAnswer(noun, distance, isPlural)` — deze/dit/die/dat.
- `getAdjectiveAnswer(noun, adjective, determinerType, isPlural)` —
  base vs. `-e` form. Adjective `-e` forms are stored explicitly per
  entry (`data/adjectives.ts`), never derived by a naive `base + "e"`
  rule, because Dutch spelling changes (rood→rode, groot→grote,
  goedkoop→goedkope) aren't uniform.

`lib/grammar/questions.ts` builds the actual on-screen question (options,
display word, English hint) from these. `lib/grammar/explanations.ts`
generates the wrong-answer rule explanation from the same functions —
never hard-coded per word.

No grammar rule lives in a React component.

## Mastery / repetition engine (`lib/mastery`)

A `ProgressRecord` per concept (`article:<wordId>`, `demo:<wordId>`,
`adj:<wordId>:<determinerType>`) tracks seen/correct/wrong counts,
mastery level (0-5), and a `scheduledReturnAtQuestion`.

- **Wrong answer**: mastery -1 (floor 0), streak reset, priority boost
  applied, and the concept is scheduled to return in 2-5 questions
  (`lib/mastery/repetition.ts`).
- **Correct answer**: every 3rd correct answer in an unbroken streak
  promotes mastery by 1 (cap 5).
- **Selection** (`lib/mastery/selection.ts`): candidates are split into
  due / learning (0-2) / stable (3-4) / mastered (5) pools, picked with
  roughly 50/30/15/5 weighting (redistributed across non-empty pools
  when one is empty), then weighted within the pool by accuracy, recent
  wrongness, and priority boost. A same-concept cooldown blocks the last
  2 questions from repeating immediately, except when the candidate pool
  is too small for that to be possible.

This is exercised directly by 83 Vitest unit tests using a seeded PRNG
so the weighted-selection behavior is deterministic and reproducible.

## Guest vs. account persistence (`lib/game/useGameSession.ts`, `lib/sync`)

Both modes share the exact same grammar/mastery engine and React state;
only where the resulting `ProgressRecord` gets written differs:

- **Guest**: written straight to `localStorage`, schema-versioned
  (`lib/sync/localProgress.ts`) so a future format change can migrate
  or safely discard old data instead of crashing.
- **Account**: kept in memory and flushed to `POST /api/progress` in a
  batch every 4 seconds and on tab-hide/unmount (via `sendBeacon` where
  available) — not one request per tap, per the build spec.

`useGameSession` checks `GET /api/auth/me` once on mount to decide which
mode it's in; the UI itself doesn't need to know.

### Guest → account merge

`lib/sync/mergeProgress.ts` merges two `ProgressRecord` maps for the
same concept: counts are summed, mastery keeps the higher value, the
newer `lastSeenAt` wins, and a pending scheduled-return is preserved
from whichever side has one — so a merge can never silently erase a
weak word or a hard-won mastery level. This same function backs both
the "save my guest progress" checkbox at registration and the merge
prompt offered at login when local guest data is found.

## Auth (`lib/auth`, `app/api/auth/*`)

Username + bcrypt-hashed password, no email. A recovery code
(`XXXX-XXXX-XXXX-XXXX`, generated from a restricted alphabet with no
ambiguous characters) is shown once at registration and only its bcrypt
hash is stored — it's the only password-reset path since there's no
email to send a link to. Sessions are HTTP-only, `SameSite=Lax` cookies
holding a `jose`-signed JWT (`{userId, username}`); `SESSION_SECRET`
signs them. Failed login/recovery attempts are tracked on the user
document itself (not in-memory) so the 5-attempt/15-minute lockout
actually holds across separate serverless invocations.

## API validation tradeoff (documented, not hidden)

Every route validates its input shape with Zod. For `POST /api/progress`
specifically, the server validates that each `ProgressRecord` is
internally consistent (mastery in 0-5, `correct + wrong === seen`, etc.)
but does not replay the underlying answer stream to independently
re-derive mastery — the client computes it with the same deterministic
engine the server would use. A full server-side replay/audit log is a
reasonable v1 backlog item if this ever needs to resist a
motivated-client trying to fabricate mastery, but score is explicitly
"motivational, not the real learning metric" per the build spec, and
mastery only gates what a learner sees next, not any privileged action.

## Content validation (`lib/validation/content.ts`)

`validateNouns`/`validateAdjectives` reject missing required fields,
duplicate ids, and invalid enums (article, category). Exercised by
tests against the live `NOUNS`/`ADJECTIVES` arrays, so a future bad
content edit fails `npm test`, not production.
