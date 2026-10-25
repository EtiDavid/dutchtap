# Grammar content references — design decision

- Every Grammar session base card must have its **own stable grammar ID**. Ratings in Everyday/Workplace do **not** imply the learner has mastered a given conjunction.
- `data/grammar-reuse-links.json` contains **explicit reviewed** cross-collection links. An entry points to an existing Core card by `sourceId` and a grammar `topic`.
- `GRAMMAR_REUSED_CARDS` resolves the original immutable Dutch, English, scenario, image and audio in `lib/flashcards/engine.ts` and provides an alias ID of the form `pat-als-reuse-<source-id>`.
- Original Core IDs, audio files, meanings and user reviews are untouched. Existing note/breakdown lookups resolve the original for aliases; variations for reused cards are a later separate task.
- Do not infer grammar links from raw substring detection: `als` in `als een plan` means "as" and does **not** teach a subordinate clause.
- Since alias IDs are new cards, existing session validation (`collection: grammar`, `topic: als`) remains valid; no migration to MongoDB required.
- Never rename or delete existing alias IDs once published. Changing this index requires a review of active-session restore semantics.
- This is the first subset (Als). The master plan's multi-topic indexing and broad editorial coverage are not complete.

## Evidence and deferred work

- 23 reviewed core source links chosen based on their use of a real conditional/time `als` clause; no automatic word search was trusted.
- Additional grammar link categories must be audited and added explicitly. Cases such as `pas als` need a more advanced explanation than basic `als`.
- Topic-specific per-skill mastery and progress migration need broader design before applying across all categories.
