@AGENTS.md

# DutchTap Claude Code — required handover for Grammar Mastery

This repository contains **partially completed** Grammar Mastery work. Before editing any grammar lesson/card/session/mastery logic, you MUST read the following files in full, in this order:

1. `docs/GRAMMAR-MASTERY-MASTER-PLAN.md` — approved/frozen DUTCHTAP-GRAMMAR-PLAN-001 v1.0, P0–P7, A01–A25.
2. `docs/CLAUDE-CODE-GRAMMAR-MASTERY-HANDOVER.md` — architecture, progress, safe worktree/branch strategy, exact next job, content schema, tests, migration/security/release rules.
3. `docs/CLAUDE-GRAMMAR-TEACHING-EXEMPLARS.md` — **mandatory teaching quality**: actual per-sentence explanations, why-before-how, phrase-by-phrase clause analysis, real Dutch-first scenarios, legitimate alternatives and non-generic corrections.
4. `docs/GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md` — the live 25-item implementation checklist, with honest partial/blocked statuses.
5. `docs/GRAMMAR-MASTERY-WORKLOG.md` — last committed work, tests and next step.

Also inspect `README.md`, `docs/ARCHITECTURE.md`, `docs/STAGE-1-HANDOVER.md`, `docs/GRAMMAR-REUSE-DECISION.md`, `docs/FRENCH-HANDOVER.md` and the actual source code. Follow AGENTS.md's Next.js 16 local-documentation requirement.

**Mission:** Complete the already approved Grammar Mastery scope in quality-checked phases. Prioritize genuine spontaneous Dutch thinking, not translation-based filler or generic "the verb goes to the end" explanations. Use the seven worked examples as the minimum pedagogy standard. Start with **P1 ALS individual structured analyses**; complete the 100 base cards and the whole ALS learning journey before widening scope.

**Current safety conditions:**
- PR #15 was **closed without merge** when the handover was written; `feat/grammar-mastery-phase1` contains valuable work. Always inspect current refs and preserve it before branching.
- Do not directly change `main`, rewrite old card IDs/progress, use live Atlas for tests, silently edit the frozen Academy curriculum, merge, push a version tag, or deploy without explicit owner approval.
- CI green ≠ all grammar content correct; `npm run grammar:release-gate` is EXPECTED TO FAIL while the audit remains incomplete.
- Keep distinct verified/partial/blocked statuses; update worklog and evidence after each slice.
- The original 1,200 Dutch Core cards, French mode, sessions, de/het games, sync/offline/history and four rating levels are protected.

**At each active execution:** check clean Git/worktree/branch; read the five documents above; implement and test the smallest unfinished phase; commit logical changes; update audit/worklog; report Done / Still open / Failing / Next with exact paths and SHAs. Do not promise background progress after the Claude Code process stops.

For the approved detailed instruction, **the handover and teaching-exemplar documents above take precedence over generic coding suggestions**. If something is unclear, use the master plan and existing runtime contracts rather than inventing a different product.
