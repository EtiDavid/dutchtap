# Review and validation

Date: 21 October 2026. Starting revision: `1f353b78e6db247011ed383d4544c1d6a5c84761`. Implementation branch: `codex/dutch-at-work`. The original checkout was not reset, merged, pushed or deployed.

## Result and scope

600 new parents, 60 per workplace area; 1,200 total Dutch parents. There are 6,000 new child entries backed by 720 distinct child sentences, 600 distinct family sets, and 1,389 distinct new model answers across 1,320 distinct prompts. Vocabulary adds 247 entries and appends 237 occurrence links across 55 existing entries. New word senses are separate when the old definition does not fit. Every new parent has relevant backlinks.

The implementation extends the existing card, family, answer, vocabulary and session lookups. Collection selection is persisted with an Everyday default for older sessions. The original Work topic remains separate. Session validation rejects cross-collection membership, unavailable French content and a mismatched workplace area. No fallback fills an insufficient pool. Existing action reducers still own weighting, unlocking, scoring, retirement and offline replay.

Old Dutch/French data and all 1,200 original image/audio files are protected by SHA-256 checks. Existing definitions and vocabulary occurrence order are retained. No localStorage keys, user data or production database was changed. The existing service worker already uses network-first pages and content-hashed static assets, so this change requires no cache-format migration.

## Checks

| Check | Result |
| --- | --- |
| Baseline unit tests | 291 passed; 7 optional local MongoDB checks skipped |
| Baseline lint / legacy media | Passed; 600 illustrations and 600 recordings |
| Final unit/content/session tests | 303 passed; same 7 optional MongoDB checks skipped |
| `npm run content:workplace` | Passed; literal sources reproduce all assembled outputs; counts, references and duplicate guards pass |
| `npm run lint` | Passed |
| Production build / TypeScript | Passed; 1,200 sentence paths |
| `npm run assets:flashcards -- --complete` | Passed; 600 recorded/illustrated cards plus 600 intentionally pictureless/device cards; no missing media |
| Full isolated Playwright suite | 75 passed |
| Final focused workplace browser run | 5 passed, mobile and desktop, with stable screenshot capture |
| Production-server workplace browser run | 5 passed; isolated fixture APIs, no production database |
| Safe installer / exact-base patch | See `installer-validation.json` and installation instructions |

The optional MongoDB suite was already skipped at baseline and was not pointed at a live database. Full browser tests use existing in-memory fixtures and mocked account/session endpoints. Native browser text-to-speech is emulated for deterministic routing checks; the tests do not establish the pronunciation or quality of a voice installed on another device. A missing Dutch voice produces guidance and no English fallback.

## Browser QA

Environment: Chromium through the repository's Playwright workflow. Browser plugin classification: absent; no callable Browser plugin was available, so the installed Playwright fallback was used. Development URL: `http://127.0.0.1:3114`; production-build URL: `http://127.0.0.1:3115`. Workplace viewports: 390 × 900 and 1280 × 900. The wider full suite also retains its original phone/desktop checks.

| Surface check | Evidence / outcome |
| --- | --- |
| Page identity | Flashcards heading, named workplace session, chosen area and sentence page verified |
| Blank page / error overlay | Real content and controls visible; inspected screenshots show no framework error overlay |
| Console health | Workplace flows captured zero page errors; full suite's existing console checks passed |
| Pictureless layout | Zero card images, no pending-image placeholder, no illustration/recording requests |
| Mobile and desktop | Screenshots inspected for readable text, wrapping and width; no horizontal overflow |
| Interaction loop | Create → Dutch at Work → area → reject 61 from a 60-card pool → create 3 → same fixed IDs in all modes |
| Prompts and rotation | Answers hidden before reveal/check; both reviewed answers visited; exact tiles, draft and selected model survive refresh |
| History and scoring | Previous card preserves actual wording; refresh/history/replay do not duplicate points |
| Child practice | Mastered parent releases two children; Easy child releases a third; child progress survives refresh and disabling |
| Device speech | Selected text and slow rate sent to nl-BE when available; Stop cancels; English-only inventory stays silent |
| Existing content | Everyday/French, original images, vocabulary, account/offline flows and limits passed the full suite |

Screenshots are kept outside the repository in temporary QA output directories. Full-page captures establish page identity and layout; focused captures show the answer, Dutch controls and explanation. Development captures can contain Next's development badge, which is absent in production captures. Fixed bottom navigation remains the existing design and content is scrollable with bottom padding. The screenshot tests wait for the arrival animation to finish.

Early development failures were resolved: old-deck assertions now explicitly test the preserved Everyday subset, while new tests enforce the expanded totals; workplace area labels now resolve in all three modes; test selectors were aligned with the actual labelled controls. No test was weakened to accept missing workplace content.

## Limits

Language review is AI editorial review, not independent native-speaker certification. Lexical duplicate screening is a heuristic, and repeated communication functions across different work situations are intentional. Device voices vary by browser/OS and require an installed Dutch voice. Safari, Firefox and physical-device speech quality were not tested. The frozen learning curriculum is unchanged and no mastery claim is made. See `LANGUAGE-REVIEW.md`, `COVERAGE.md` and the machine-readable reports for details.
