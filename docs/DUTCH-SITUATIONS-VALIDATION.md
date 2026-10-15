# Situation and answer-rotation validation

Validated on 15 October 2026 against `EtiDavid/dutchtap` main `eae186527dc0efb8ca1547a692ec2892cd635ec8`, including the previously delivered gradual-variation implementation.

## Results

- `npm test`: **291 passed, 7 skipped**. The skipped tests require a separate MongoDB integration service; no live account database was used.
- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript and 620 generated pages.
- Flashcard browser suite: **70 passed** in Chromium. Guest sessions and account/offline flows use the actual reducer with an isolated in-memory API harness. No production credentials were needed.
- `npm run assets:flashcards`: 600 images and 600 audio recordings ready; no asset errors.
- Rebuilding `data/dutch-communication.json` twice produced identical bytes. SHA-256: `c171c982d3d524508ae45b9713f1f5262a72a02c8480a16d9170ab1265a48e5a`.
- `git diff --check`: passed.

The browser plugin was unavailable in this environment, so the browser suite used ordinary Playwright with an external Chromium binary. That binary and its configuration are testing tools outside the repository; no application dependency or lockfile was changed for them. The normal local command remains `npm run test:flashcards` after installing Playwright Chromium.

## What was checked

The content tests cover all 600 main cards and 6,000 family entries: authored situations, preserved original model text, English meanings, nonempty grammar explanations, unique model IDs, and tile-size limits. Specific regressions distinguish **nieuw** from **onbekend**, preserve complete time phrases such as **uiterlijk maandag**, and exclude invalid fronting of **al** meaning already.

Reducer tests cover every model in a shuffled cycle, no repeated model across cycle boundaries when alternatives exist, changed word counts, saved drafts, refresh, stale actions, duplicate submissions, offline replay, lost responses, a second device, actual accepted-word-order feedback, old saved attempts, old queued actions, Dutch child progress, French isolation, and ten-success retirement across alternate models.

Browser checks exercise situation-only prompts before checking, matched model text and explanations afterward, other model answers, ten related child examples, recorded versus device audio routing, Dutch voice selection, score preservation, read-only Previous card, session creation and limits, completion, navigation, vocabulary links, and existing French behaviour. Mobile at 390px and desktop at 1280px were checked for overflow and console errors; screenshots of the new answer panels were visually inspected.

Quiz recognises the reviewed model inventory, not all possible Dutch paraphrases. Speaking remains self-rated. Device audio depends on a Dutch voice installed in the learner's browser or operating system. These limits are stated in the interface.

## Delivery status

The code and content are completed in the working branch. A GitHub branch-creation attempt returned HTTP 403, `Resource not accessible by integration`. Nothing was pushed, merged, or deployed. The delivery ZIP contains both a patch against the repository base above and an incremental patch for the previous variation package, plus an installer that checks applicability before changing files.
