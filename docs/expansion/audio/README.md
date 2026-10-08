# Diederik recording batches

Record `batch-01.txt` through `batch-10.txt` in numeric order. Each contains exactly
25 reviewed Dutch sentences with blank lines. Paste only the `.txt` contents into
ElevenLabs and use **Diederik — Vlaamse warme stem** on the website. The numbered
filenames and IDs in `manifest.json` must not be spoken. No API access is needed.

Keep each downloaded recording separate and identify its batch number when
providing its local file path to Codex. Keep the text unchanged; if a sentence
needs a correction, update the text and manifest before rerecording that batch.

`manifest.json` gives every position, sentence, card ID and final MP3 filename.
Files will be installed at `public/audio/flashcards/<id>.mp3`, matching the original
deck's convention. The original 50 MP3 files will not be overwritten.

Silence may occur inside a sentence. Splitting requires a reviewed boundary for
each of the 25 sentences, with the first/last words checked against the manifest.
After splitting, decode every clip to check duration and missing/truncated speech;
use listening or a suitable Dutch transcription tool to check sentence identity.
If identity cannot be verified automatically, request targeted listening checks.
Decoder validation alone does not establish pronunciation or identity.

Install clips atomically after review, then update the card and manifest from
`awaiting-recording` to `ready` / `installed`. Playback uses the normal recording
and 0.8× slow playback with pitch preservation. Vocabulary remains text-only.

All ten Diederik batches were installed after ordered Dutch speech alignment and
quiet-boundary verification. See `installation-report.json` for source hashes,
recognized text, timing boundaries, similarity scores and final clip hashes.
`npm run assets:flashcards -- --complete` now verifies all 300 card illustrations
and recordings.
