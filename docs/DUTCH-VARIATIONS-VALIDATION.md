# Validation record

Base: `eae186527dc0efb8ca1547a692ec2892cd635ec8` (GitHub main was checked against this commit).

- `npm test`: **275 passed, 7 skipped**, across 33 test files. The skipped cases require the optional MongoDB integration environment; no live Atlas database was used.
- Browser suite: **67 passed**. Covers phone and desktop layout, fixed sessions, main-card completion, account isolation, offline retries, two-device merges, French regression coverage, gradual Dutch children, selected-rating persistence, read-only Previous, and a Dutch device voice with no recording request.
- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript and 620 generated pages.
- `npm run assets:flashcards`: all 600 main images and 600 main audio assets ready; zero errors. No new paid audio was requested.
- Dataset authoring followed by editorial corrections: rerunning produces byte-identical JSON, retaining original examples and stable family assignments.
- Patch application: verified against a clean copy of the exact base, followed by byte comparisons for every changed file.

The standard Playwright Chromium download failed in this environment. Browser testing used a compatible Chromium 153 binary from the official `@sparticuz/chromium` package through a temporary external config; no browser-test dependencies were added to the application. The package includes standard Playwright tests runnable with the repository's normal config.

The senior-review pass checked stable IDs, old-session defaults, validation of locked/outside-language children, independent main/child difficulty and retirement, manual opt-out, bounded history, scoring idempotency, and existing global rating effects. One new account test replays an offline child rating after a lost response and confirms that a second device sees exactly one attempt.

Scope of language checks: explanation coverage and editorial corrections across the Dutch main deck, plus an explicitly authored reusable Dutch/English practice bank. This is not a native-speaker certification. Exact taught-word-order scoring does not evaluate every grammatically valid alternative, and Speaking remains honest self-rating rather than automatic pronunciation assessment.

GitHub rejected branch creation with HTTP 403 (`Resource not accessible by integration`). No remote branch, pull request, or deployment was created. The local implementation is delivered as a patch and changed-source package.
