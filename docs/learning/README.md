# Dutch learning upgrade — first implementation

This branch contains a working first release of the learning labs and an editorial review queue. It does **not** claim that all existing language content has been individually rechecked.

## What is available

- Home groups remembering, sentence production and quick grammar games. Learn is available in the Dutch navigation bar.
- Sentence Builder covers V2/inversion, omdat, dat, als, tot and toen.
- Verb Lab has 20 explicit reviewed verb records, including eight separable verbs; select a verb and present/simple past/perfect.
- Tense Lab includes the distinction between gegaan/geweest and gezeten/gaan zitten.
- Think in Dutch mixes the same 110 contextual tasks. Practice has self-rated speaking; Quiz offers tiles or typed answers.
- Dutch-first, listen-first and English-support settings; prompt playback, model playback and slower model playback. Current device speech remains available until the later recording stage.
- Saved current exercise, exact tile order/draft, read-only previous exercises, idempotent result recording and local due-review weighting. Selections are reflected in the URL so refresh restores the same exercise context.
- New lab state is saved **on the current device**, separately for guest/account names and filter/mode. It does not yet sync to another device or contribute to existing account points. Existing flashcard account sync is unchanged.
- Optional sound/confetti for new correct lab, flashcard quiz and grammar-game answers. Preferences are remembered on the device; reduced motion suppresses confetti. Restoring an outcome or opening history does not celebrate or award another result.
- Eight new vocabulary entries and 22 existing headwords enriched with source sentence links, lesson examples and useful verb forms. Existing dictionary senses and explanations are preserved.

## Editorial policy and current status

`data/editorial/communication-corrections.json` is a small authoritative overlay applied to the existing generated communication data. It preserves all original answer IDs/text, replaces selected scenario/explanation metadata and appends substantive alternatives. It does not need to mutate or manually rewrite the old generators' outputs.

The cooking, group holiday, new dish/soup, agreement, considering options, form completion, sitting down, waiting-room and selling examples discussed with David have been revised: 13 distinct communication tasks. Pronoun/inflection-only variants are shown as usage notes rather than principal rotation choices. Historical models remain resolvable for saved attempts.

Run `npm run content:audit` to rebuild `content-review-queue.json`. The inventory currently has 1,200 main cards and 2,260 distinct communication tasks. Thirteen have this pass's explicit revisions; 2,247 are pending detailed semantic review. Repeated-explanation and speaker-number flags identify priorities. Passing a structural check is not language certification. New lessons are AI-reviewed, without independent native certification.

The frozen Nova Dutch Academy curriculum is not changed. The labs practise related skills but are not the Academy promotion exam, and do not replace diary drill scoring. Adding named toen/tot modules to the frozen curriculum remains a proposed documented change.

## Authoring and vocabulary

- `data/learning-topics.json`: scoped grammar explanations.
- `data/learning-tasks.json`: stable task ID, Dutch/English scenario, tense, verb when applicable, exact approved answer(s), English meaning and short specific explanation.
- `data/learning-verbs.json`: explicit finite forms, participles, auxiliary and separable particle; no automatic guess at irregular conjugation.
- `scripts/sync-learning-vocabulary.mjs`: produces `data/learning-vocabulary.json` from these reviewed forms, actual main-card occurrences and lesson references. It reuses existing headwords and preserves existing sense IDs.
- Quiz matches only the reviewed inventory after conservative case, punctuation and whitespace normalization. An unmatched answer may be natural Dutch; the UI says to compare it rather than declaring all unrecognised Dutch ungrammatical.

The full ten-example family relevance review, additional topic coverage, cross-device lab progress and curated multi-turn conversations remain later work. Keep this PR in draft until its intended scope is reviewed; the existence of the new screens is not evidence the entire upgrade plan is complete.

## Audio later: recommended workflow

First finalise the language, then generate audio. One clip per manifest utterance is easiest to align. If using long recordings, use **50 utterances per batch**, and allow the exporter to reduce this further for long prompts. It accepts up to 100, but 50 makes checking/correction easier. Identical text is deduplicated before export; existing matching card recordings are reused.

Export reviewed Dutch content only (no billable calls):

```bash
npm run audio:export -- --size 50 --out audio-export/nl
```

English situation prompts must be exported separately and spoken with an English voice:

```bash
npm run audio:export -- --size 50 --language en --out audio-export/en
```

Each export has a manifest and ordered `.txt`/`.ssml` batch scripts. Do not speak the IDs, filenames or instructions. Plain blank lines do **not** reliably produce three-second pauses. The SSML files contain `<break time="3s" />`; use these only if the chosen provider/model explicitly supports the tag. Otherwise create individual clips or insert silent gaps in an editor. Do not assume all ElevenLabs models interpret SSML alike. `--include-unreviewed` creates a draft export for review, not production audio; the importer refuses it.

Keep the exact manifest and return each recording with its batch name. The import utility requires ffmpeg/ffprobe and defaults to inspection only:

```bash
python3 scripts/import-learning-audio.py --manifest audio-export/nl/manifest.json --batch nl-batch-001 --audio /absolute/path/recording.mp3
```

It detects internal silences of at least 2.5 seconds and requires exactly one less separator than the number of utterances. It refuses mismatches rather than guessing. Inspect the output and listen to the segments against their printed texts. For irregular gaps, provide `--segments segments.json`, a list of `[startSeconds,endSeconds]` pairs. Silence detection cannot prove that a spoken sentence matches the text.

Only after alignment review, add `--apply`. The utility renders the batch before installation, refuses to overwrite existing clips, installs into `public/audio/utterances` and atomically updates `data/audio-index.json`. Rebuild afterward. The central playback service resolves those recordings for prompts, alternatives, examples and words without each caller needing a card audio path. No provider keys are needed for export/import, and no paid audio has been generated in this change.

The export's approved set is deliberately smaller than the full corpus until editorial review is complete. In production, complete recording coverage and decide whether to disable device fallback only after all approved assets are installed and verified.

## Checks

```bash
npm run lint
npx next typegen
npx tsc --noEmit
npm test
npm run content:learning-check
npm run content:audit
npm run content:workplace
npm run assets:flashcards
npm run build
npm run test:flashcards
```

The tests exercise saved drafts, result idempotency, independent self-rating, vocabulary provenance, meaningful cooking alternatives, retained historical answer IDs, language-correct voice selection, transcript batching and real ffmpeg pause-count checks using synthetic tones. Browser tests cover mobile/desktop lesson flows, refresh, history, sound settings, reduced motion and legacy de/het celebration. Synthetic tones validate the cutting mechanism; they are not spoken Dutch recordings.
