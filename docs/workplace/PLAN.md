# Dutch at Work implementation ledger

Starting revision: `1f353b78e6db247011ed383d4544c1d6a5c84761`.
Existing main deck: 600 Dutch cards; French has its existing 600 translations.
Work happens on `codex/dutch-at-work`, without changing existing card text/IDs or media.

## Delivery sequence

1. Inspect baseline, current session/model/variation/speech contracts and installed Next documentation.
2. Establish complete benchmark cards, explicit grammar annotations and reviewed word-form lexicon.
3. Author ten area batches: 60 parents per area. Six smaller situations per area avoid repetitive stock requests.
4. Author a related workplace practice library, with explicit English situations and teaching notes. Assemble 6,000 stable family entries from that reviewed library; report distinct sentences honestly. No runtime translation or automatic conjugation.
5. Integrate collection selection through the existing engines and default old saved sessions to Everyday. Keep French restricted to its published content.
6. Extend existing grammar/vocabulary/answers/children lookups, pictureless rendering, device speech and asset validation.
7. Check all content and behaviour; run lint, tests, content/assets, production build, isolated mobile/desktop browser suite. No production database.
8. Review preservation, package changed files and patch, and test a safe installer against the exact clean base and conflict cases.

## Ten areas (60 parents each)

| Area | Six smaller situations |
| --- | --- |
| Office conversation and introductions | joining a team; role/responsibility; finding facilities; availability; breaks/colleagues; home/office working |
| Help, clarification and repetition | repeating speech; identifying references; checking meaning; demonstrations; missing detail; pace/language confidence |
| User support and support requests | intake/contact; request details; appointments; remote assistance; expectations; follow-up/closure |
| Problems and their impact | visible symptoms; affected people; onset/history; intermittent behaviour; scope/impact; what still works |
| Troubleshooting and explaining steps | settings; reproduction; safe user actions; comparing observations; narrowing causes; next diagnostic steps |
| Meetings and progress updates | stand-ups; completed work; blockers; participation; notes/decisions; agreed actions |
| Tasks, priorities and deadlines | selecting priority; estimating effort; asking support; delays; workload negotiation; planning/dependencies |
| Changes, testing, access and permission | access requests; explicit permission; test preparation; observations; scheduling changes; approval/rollback |
| Incidents, escalation and handovers | reporting disruption; impact/status; escalation; workaround/fix distinction; shift handover; ownership/follow-up |
| Email, chat and remote collaboration | clear written updates; arranging calls; sharing documents; receipt/understanding; response requests; remote coordination |

## Review and environment

AI editorial review is distinct from independent human/native review. No native certification is claimed.
Browser plugin not available; use installed Playwright and isolated flashcard fixtures.
The supplied frozen grammar curriculum and selected extracted passages from the available possessives and July diary PDFs are background, not an answer key or mastery evidence. PDF translations contain defects and will not be copied as verified material.

Progress and actual validation outcomes will be recorded alongside the authored batches and final reports.

## Saved authoring checkpoints

- Baseline: unit 291 passed / 7 isolated MongoDB tests skipped; lint passed; 600 image/600 recording asset checks passed.
- Ten complete benchmark parent rows and their first 12 child models established the authoring format. Five collection/session/replay regression tests passed; Next type generation and TypeScript passed.
- Office, clarification and user support authored: 180 parents, 1,800 child entries, 216 distinct child sentences. Compiled output is intentionally incomplete. Vocabulary enrichment and final cross-batch editorial review remain in progress.
- Family examples intentionally reuse a thematic reviewed library. The assembler only combines literal reviewed sentence parts and explicit lexicon forms; it does not translate or derive conjugations.
- Next: author problems/impact, troubleshooting, meetings, priorities, changes, incidents and remote areas; complete vocabulary; validate all source/answer annotations; then finish integration tests, assets, browser QA and download installer.

## Completion checkpoint

- All ten areas authored: 600 new parents, 6,000 child entries, 720 distinct child sentences, 600 distinct family sets and 1,389 distinct models.
- Vocabulary completed: 247 additions; 237 new backlinks across 55 existing entries. Different meanings have separate entries; original definitions remain unchanged.
- Final content/session suite: 303 passed / 7 optional local MongoDB tests skipped. Lint, content assembly, original media checks and production build passed. Full isolated browser suite: 75 passed; focused workplace tests: 5 passed on development and production builds.
- Exact duplicates are rejected. The final lexical near-duplicate screen found no candidates at the recorded threshold after replacing one redundant recovery-time sentence.
- Local implementation complete. Installer/package verification is recorded in the delivery reports. No push, merge, deployment or production database access is authorised or performed.
