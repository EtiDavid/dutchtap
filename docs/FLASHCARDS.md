# Daily Dutch — speaking flashcards

600 A1/A2-oriented sentences: the preserved original 50, 250 reviewed
additions extracted from the two supplied source videos, and a second set of 300
(`work-31` to `work-330`, see [STAGE-2-HANDOVER.md](STAGE-2-HANDOVER.md)). Every card has a situation,
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

## Learning sessions

A **session** is one fixed set of sentences that the learner studies, says from memory and quizzes
on. Switching modes never changes the set; refreshing, navigating, logging out and in, or using another
device (signed in) continues exactly where the learner stopped. Guests get the same sessions, saved on
the device. See [STAGE-1-HANDOVER.md](STAGE-1-HANDOVER.md) for the contracts and rules.

Two different filters are used, with these names everywhere:

* **Topic / place**: shopping, school, transport, ... or *All places*.
* **Knowledge level**: Difficult, Medium, Easy, Mastered. New cards are Difficult.

**Creating a session** (Flashcards page): choose the topic, a card count (10, 20, 30, 50 or a custom count from
1 to 100) and ONE starting level. The dialog shows how many cards each level has in that topic, using the
latest global levels. A level with fewer cards than requested is disabled and explained ("Easy has 12 cards;
you requested 20. Choose fewer cards or practise Difficult cards and rate them Easy."). Nothing is ever
substituted silently. The distinct cards are picked **once** and stored; later global-level changes or new
deck content never change an existing session. At most **five active** sessions are allowed (completed ones
do not count). A session can be renamed, deleted (one confirmation; global levels and other sessions stay),
and, once finished, practised again as a new session over the same cards.

**Study** (no grading): the session's cards in shuffled *complete* rounds, each card once per round, with
Dutch, English, picture, audio, grammar breakdown, variation, similar examples and vocabulary links. No
levels, no counters, no points; it never completes a session.

**Speaking** (weighted retrieval): picture and situation first, Dutch and audio hidden. After **Check the
Dutch** the learner must explicitly rate the attempt (Difficult / Medium / Easy / Mastered), even if the
card's last level is shown as a hint. There is no skip. Mastered means "I recalled this correctly before
revealing". The rating becomes the card's global level. Cards are drawn at random favouring Difficult
over Medium over Easy over Mastered (weights 8 / 4 / 2 / 0.5), never the same card twice in a row while
two or more remain. **Ten consecutive Mastered ratings retire a card from Speaking in this session**
(any other rating resets that session/card count to zero; revealing, listening, leaving or refreshing never
counts). A card keeps its global level and can appear in other sessions.

**Quiz** (word order, +10 points): picture and English meaning; tap the shuffled words into the taught
sentence. Each word is its own token, so repeated words work. A correct submission gives +10 points and one
step toward ten correct in a row; a wrong one gives 0, resets that card's streak, shows the taught
sentence with grammar help, and makes the card come back sooner. Ten correct in a row retire the card from
the Quiz in this session. The same attempt can be scored only once, even across refreshes, retries and
devices. Different valid Dutch word orders are described as such, not as ungrammatical.

A session is **completed and archived only when both Speaking and the Quiz are complete**. Completed
sessions keep their history, stay open for Study, free an active slot, and are never reset by reopening.

## Vocabulary

`/vocabulary` is a text-only browser linked from Home and sentence cards. It
contains 441 reviewed words and expressions linked to the 600-card deck.
Search uses Dutch headwords, English meanings and Dutch explanations; filters
cover place and word type. Nouns include articles and plurals when appropriate,
and separable/reflexive verbs include useful forms. Every example links to an
actual card at `/sentences/<id>`. No pictures, recordings or progress system are
added for vocabulary.

## Persistence

* **Global card levels** (one record per card) are unchanged from before sessions: `dutchtap:flashcards:v2:guest` and
  `dutchtap:flashcards:v2:user:<username>` on the device, and the `flashcardReviews` collection for accounts. Speaking
  ratings update exactly one record, not the whole deck.
* **Sessions**: accounts store them in the `learningSessions` collection (owner = the signed-in user, never taken from
  the client); guests in `dutchtap:sessions:v1:guest`. Signed-in users also keep a copy and an unsent-action queue on the
  device (`dutchtap:sessions:v1:user:<username>`), so a dropped connection loses nothing.
* **Streak days** are per person on the device (`dutchtap:practice-days:v2:<scope>`); the old shared list becomes the guest's.
* Old transient practice state (`dutchtap:session:*`) is offered once as a saved session where it is valid, otherwise
  dropped with an explanation. Global levels are never touched by that import.

## Playback

Generated MP3s are preferred. Slow playback uses 0.8x with pitch preservation.
On missing/failed legacy files, a Dutch device voice is used only when available.
The 250 additions use their installed Diederik clips and never substitute a device
voice. If neither legacy source is available, the UI says so.
Recall mode offers audio only after revealing. New playback stops the previous
clip, and leaving a card/unmounting cancels playback. No microphone or external
speech service is used by the deployed app.

## Verification

* `npm test`: unit tests for the session engine, server logic, client store (offline, replay, two devices, import,
  isolation), service worker, deck content, grammar notes and breakdowns.
* `npm run test:sessions-db`: the same server logic against a **real MongoDB** (parallel creation of the fifth session,
  owner isolation, compare-and-swap with simultaneous writers). Start a throwaway local database first:
  `docker run -d --name dutchtap-test-mongo -p 127.0.0.1:27018:27017 mongo:7`. These tests refuse to run against
  anything but localhost, so they can never touch Atlas.
* `npm run test:flashcards`: browser tests (mobile and desktop widths) with account endpoints served by the real server
  logic in memory; never Atlas. Use `E2E_PORT=3100` if another dev server already uses port 3000.
* `npm run test:prod`: builds the app and checks the production service worker (offline visits, old-cache removal).
* `npm run assets:flashcards -- --complete`: confirms all 600 pictures and recordings exist.

Live ElevenLabs generation and real Atlas syncing are not covered by automated tests.

## Progress picture, milestones and streak

- The Flashcards dashboard shows a stacked bar of Difficult / Medium / Easy / Mastered counts for the whole deck
  (`components/flashcards/LevelBar.tsx`) and how many more Mastered cards until the next milestone. It is a picture
  of learning, not a score, and it is separate from each session's progress.
- A Speaking rating that makes the Mastered total reach **10, 50 or 100** shows a dismissible congratulation
  (`lib/flashcards/milestones.ts`). It appears at the moment of the rating only, so a reload never repeats it.
- A gentle **practice streak** (dashboard, Quiz page and Home) counts consecutive days with at least one Study step,
  Speaking rating or Quiz answer. A streak from yesterday stays alive until the end of today and missing a day never shows
  a penalty message (`lib/practice/streak.ts`). Practice days are stored per person on this device only and are not
  synced to accounts.

## Grammar notes and sentence breakdowns

Every sentence has a collapsible **Grammar rule & similar examples** panel with two layers:

1. **Sentence breakdown** (`data/grammar-breakdowns.json`): what the speaker is doing; the sentence cut into
   labelled parts using its own words (the labels spell out the pattern, for example *time phrase + finite verb +
   subject + direction*); why the word order is what it is (verb-second, inversion, question, imperative,
   subordinate verb-final, verb bracket; "second position" means the second *constituent*, not the second word);
   the verb forms and endings that matter; a comparison with English; and one common mistake with the correction
   and the reason.
2. **In short** and **similar examples** (`data/grammar-notes.json`): the short rule plus 2 to 3 examples with
   English, each with a device-voice 🔊 button (there are no recordings for them).

The breakdown parts are tested to rebuild exactly the card's sentence. The "why this word order" text was generated
from the labelled parts using each sentence's own words and then reviewed; the other fields were written by hand.
**All of this was written by an AI assistant and has not had a native-speaker review.** Treat it like the rest of the
content and have a Dutch speaker check it. Coverage of the patterns David has practised is audited in
[GRAMMAR-COVERAGE.md](GRAMMAR-COVERAGE.md).

## Navigation

The learning pages (Flashcards, Quiz, Words and sentence pages) share a bottom tab bar
(`components/nav/AppNav.tsx`): Home, Flashcards, Quiz, Words. A dot on a tab means an active session is waiting.
Sessions open inside the Flashcards page (`/flashcards?session=ID&mode=study|speaking|quiz`), so one cached page serves
every session, online or offline. A session shows its name, a **Study / Speaking / Quiz** switcher with each mode's
progress, and **Back to sessions**. The **Quiz** tab opens a chooser of active sessions (the quiz always uses one
session's own sentences). Vocabulary and sentence links return to the same session, mode and card (browser Back).
