# Daily Dutch — speaking flashcards

300 A1/A2-oriented sentences: the preserved original 50 plus 250 reviewed
additions extracted from the two supplied source videos. Every card has a situation,
English meaning, a short pattern explanation and a variation. Individual editorial
illustrations depict each sentence and share the established visual style. This complements the frozen Nova Dutch Academy
curriculum; self-ratings do not promote a formal grammar module.

## Generate audio on your PC

For the 250-card expansion, the workflow is **manual ElevenLabs recordings with
Diederik**, followed by local splitting and installation. No ElevenLabs API is
used for that expansion. The ten approved text batches and ordered ID mappings are
in `docs/expansion/audio/`. See [expansion status](expansion/STATUS.md) for source
provenance and current asset counts. The API commands below document the existing optional legacy script;
they are not required for the manual recording workflow.

Use Node **20.12+** (or a newer supported Node release). Pull this feature branch
first. The script runs locally; credentials are never read by the browser or a
Next.js API route. `.env.local` is already ignored by Git.

Keep the existing key and add a voice ID to `.env.local`:

```dotenv
ELEVENLABS_API_KEY=your_existing_key
ELEVENLABS_VOICE_ID=your_selected_voice_id
# Optional; default is eleven_multilingual_v2
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

From the project directory, list available account voices:

```bash
npm run audio:voices
```

Choose a voice whose preview sounds naturally Dutch. The listing includes
labels to help selection but does not certify pronunciation. Copy the voice ID
into `.env.local` using your editor. Do not paste the API key into chat.

Preview the generation plan without API calls:

```bash
npm run audio:check
```

Generate three sample files (uses ElevenLabs credits):

```bash
npm run audio:sample
```

Samples are shopping-01, school-01 and transport-01 in
`public/audio/flashcards/`. Listen to them directly or in the Explore mode.
Ask a fluent Dutch speaker to check accent, pronunciation and pace before
producing the full deck. Automated HTTP checks cannot establish accent quality.

Generate all 50 files using the same settings:

```bash
npm run audio:all
```

Matching existing files are skipped. Different/unknown settings do not silently
replace a paid recording. After deliberately choosing a new voice, regenerate:

```bash
npm run audio:all -- --replace
```

The script produces one MP3 per card and an integrity manifest. Partial downloads
are written to `.part` files then renamed. Errors stop generation while preserving
completed clips. No automatic POST retry is used because an ambiguous timeout may
already have consumed credits. No extra SDK or dotenv dependency is required.

Verify your ElevenLabs plan permits your intended website use before publishing
recordings. Commit the audio files and manifest after checking them, then deploy
through your normal workflow. No ElevenLabs key is needed on the hosting platform.

## Flashcards

Two modes, both started from a pop-up asking how many cards to practise
(10 / 20 / 30 / Unlimited). No score, points or day schedule are kept.

- **Read & understand** shows the picture and the Dutch sentence, with English,
  audio and a grammar note.
- **Say it from memory** shows only the picture and a short *situation* (a
  `scenario` per card, not a translation) and asks "How do you say it?". The
  **Check the Dutch** button reveals the sentence and audio.

Before moving on, the learner picks a level for the card: **Difficult, Medium,
Easy or Mastered**. Every card starts as Difficult, and its last choice is
pre-selected the next time it appears.

**Skip without rating** is available before and after reveal. It stops playback
and advances without saving a level or changing learning counters.

A number of cards (e.g. 10) is the size of the *set*: that many cards are picked
at random, favouring Difficult ones, and the session keeps cycling through them
until the learner finishes. Unlimited draws from every card in the chosen place.

How often a card is drawn (`lib/flashcards/engine.ts`, weights are tunable):
Difficult 8, Medium 4, Easy 2, Mastered 0.5 — and 0.15 once a card has been
marked Mastered 10 times. The card just shown is not repeated immediately.

## Quiz

`/quiz` is separate from the flashcards but uses the same pictures, sentences and
saved progress record. Each question is one of two active-recall exercises:

- **Fill the blank** blanks a verb form (ben/bent/is, kun/kunt/kunnen, …) or de/het,
  deze/dit, offering only options where exactly one is grammatical.
- **Word order** has the learner tap the shuffled words into the sentence.

Types alternate. Sentences answered wrongly come back sooner (weight 8); new ones
weigh 6; a streak of 5 correct slows a card (2) and 10 correct in a row slows it
further (0.5). No score is kept. Exercises are pure and seeded
(`lib/flashcards/exercises.ts`). Word order is checked against the card's sentence,
and the prompt explicitly asks to reproduce that taught sentence. A different
order is described as a mismatch, without claiming it is ungrammatical.
Reviewed valid hebben/kunnen forms with u and je are accepted and excluded from
wrong options.

## Vocabulary

`/vocabulary` is a text-only browser linked from Home and sentence cards. It
contains 163 reviewed words and expressions linked to the 300-card deck.
Search uses Dutch headwords, English meanings and Dutch explanations; filters
cover place and word type. Nouns include articles and plurals when appropriate,
and separable/reflexive verbs include useful forms. Every example links to an
actual card at `/sentences/<id>`. No pictures, recordings or progress system are
added for vocabulary.

## Persistence

One record per card (`level`, `masteredCount`, `seen`, quiz counters, `updatedAt`)
in the browser (`dutchtap:flashcards:v2:guest` or `…:v2:user:<username>`) and, for
signed-in users, the `flashcardReviews` MongoDB collection (unique user/card index,
newest `updatedAt` wins). The earlier rating/schedule format is ignored: old local
data lives under a different key, old server rows are skipped on read and cleaned
when a card is next saved. An explicit button copies guest progress into an account.

## Playback

Generated MP3s are preferred. Slow playback uses 0.8x with pitch preservation.
On missing/failed legacy files, a Dutch device voice is used only when available.
The 250 additions use their installed Diederik clips and never substitute a device
voice. If neither legacy source is available, the UI says so.
Recall mode offers audio only after revealing. New playback stops the previous
clip, and leaving a card/unmounting cancels playback. No microphone or external
speech service is used by the deployed app.

## Verification

Unit tests cover the deck, levels, weighted drawing, quiz weights, merge and schema
(`tests/flashcards*.test.ts`). `npm run test:flashcards` runs browser tests for both
modes, the quiz and a mocked account sync; they do not touch Atlas. Live ElevenLabs
generation and real Atlas syncing are not covered by automated tests.
