# DutchTap — Cloudflare R2 audio migration (staged; safe for rollback)

## Confirmed transfer (2026-11-01)

The operator uploaded the exact-text Dutch utterance directory to R2 using `rclone copy`. Both
local and remote had **7,796 MP3 files**. A subsequent `rclone check --download` reported
**7,796 matching files and zero differences**. This proves the contents of the copied
utterance folder match, **not** that unauthenticated browser playback is configured.

The legacy `public/audio/flashcards/` recordings remain in the app and have NOT been
migrated. Do not remove those assets. None of these steps delete local or remote files.

## Step 1 — Make the public audio origin work

R2 public development origin provided by the operator:

\`https://pub-5d02f88f4e784eaba8df9e2b6eb77f13.r2.dev\`

The sample \`0003d9bb40d98b32b6931297.mp3\` is present in the audited index and corresponds to **Ik ga nog niet met de uitvoering akkoord.** The public URL itself still requires an actual HTTP/browser playback check; an uploaded R2 object is not proof of public availability.

From the project root, run the no-credentials HTTP smoke test:

\`\`\`bash
node scripts/check-r2-public-audio.mjs https://pub-5d02f88f4e784eaba8df9e2b6eb77f13.r2.dev
\`\`\`

R2 object storage is private by default. To test browser playback:
- Cloudflare dashboard → R2 → `dutchtap-audio` → Settings → **Public Development URL** → Enable.
- Use a recorded example: `<PUBLIC_BASE_URL>/utterances/68562b3c36c0464133b45a08.mp3`
- Test a direct browser request (HTTP 200 and playable MP3). The private S3 API endpoint is
  **not** an audio playback URL.
- The `r2.dev` public URL is rate-limited and intended **only for testing**. Before
  production use, add a custom domain under R2 bucket Settings → Custom Domains. The
  domain must be managed by the same Cloudflare account as the bucket.

## Step 1b — Migrate the 600 original base flashcard recordings

The initial R2 copy included **7,796** files in `public/audio/utterances/`. It did
**not** include the **600 original MP3s** stored in `public/audio/flashcards/`.
These original base cards have explicit `audio` paths in the three flashcard JSON files
(`50 + 250 + 300`) and take priority over indexed exact-text recordings.

On the user's WSL machine, upload **only MP3s** (the legacy directory also contains
a non-audio JSON file):

```bash
cd ~/dutch/dutchTap
rclone copy public/audio/flashcards/ \
  dutchtap-r2:dutchtap-audio/flashcards/ \
  --include '*.mp3' --progress --transfers 8

rclone check public/audio/flashcards/ \
  dutchtap-r2:dutchtap-audio/flashcards/ \
  --include '*.mp3' --download

find public/audio/flashcards -maxdepth 1 -name '*.mp3' | wc -l
rclone lsf dutchtap-r2:dutchtap-audio/flashcards/ \
  --files-only --include '*.mp3' | wc -l
```

Require **600 matching MP3s and zero differences** before enabling the cutover.
Test public R2 audio playback directly, e.g.:

`https://pub-5d02f88f4e784eaba8df9e2b6eb77f13.r2.dev/flashcards/shopping-01.mp3`

Then set this extra Vercel **Preview / Config** environment variable and redeploy
the migration branch:

```text
NEXT_PUBLIC_DUTCH_AUDIO_LEGACY_R2=true
```

This uses the **existing** `NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL` origin, but redirects
the 600 original card paths to `/flashcards/*.mp3` on R2. Leave the toggle **unset**
until upload verification passes; otherwise existing base cards would fail to play.
With the toggle disabled, existing base cards still use Vercel's local files.
The toggle can be disabled and redeployed to roll back.

Verify original base cards (including `shopping-01` and `work-31`), their slow
playback, and the new indexed card prompts. All should request media from R2.
No existing cards need to be re-recorded, and none of these commands delete files.

## Step 2 — Deploy a reversible client routing change

Only **indexed** `/audio/utterances/<24-hex-id>.mp3` files are redirected.
Legacy flashcard audio is opt-in via `NEXT_PUBLIC_DUTCH_AUDIO_LEGACY_R2=true` after verifying its separate 600-file upload. French remains unchanged.
`data/audio-index.json` retains its local-style `path` values and does not need a
risky 7,796-entry rewrite.

Set a Vercel environment variable (safe to publish, **not** a credential):

```text
NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL=https://YOUR-PUBLIC-R2-ORIGIN
```

The value must be an HTTPS origin (no `/utterances` path and no trailing object key).
`NEXT_PUBLIC_...` is embedded at **build time**; redeploy the branch after configuring
it. Set the variable in **Preview** first, and verify Preview before enabling in Production.

If the variable is not set, DutchTap continues using local URLs so the migration can
be tested and rolled back. Do not remove local MP3s until Cloudflare playback is proven.

Test `/audio-preview`, flashcards, spoken prompts, grammar and vocabulary, including
both normal and slow playback, and test that legacy word audio still works. The
current player falls back to device TTS on missing/broken recordings; remove that
Dutch fallback separately before claiming complete recorded-only coverage.

## Step 3 — Publish subsequent recordings

The paid generator still creates checksummed MP3s locally for resumability and
backup. The new script publishes the **installed** audio index inventory to R2 and
verifies it. It uses credentials stored by the local `rclone` remote, never in Git.

```bash
node scripts/publish-dutch-audio-r2.mjs
node scripts/publish-dutch-audio-r2.mjs --apply
# For a full content comparison (downloads remote objects for verification):
node scripts/publish-dutch-audio-r2.mjs --apply --deep-check
```

After the Cloudflare migration is validated, the budget campaign can publish every
finished batch automatically when run with `--r2-remote`:

```bash
node scripts/record-dutch-audio-budget.mjs \
  --account account2 --budget <YOUR_EXISTING_CUMULATIVE_BUDGET> \
  --r2-remote dutchtap-r2:dutchtap-audio/utterances --apply
```

**Budget is cumulative** for an existing campaign label. Never reuse a label for a
different ElevenLabs key. The new R2 flag does not alter credit controls.

The publisher checks the local index and matching MP3 names, uploads with `rclone copy`,
then runs `rclone check --size-only`. Use `--deep-check` when you want to
re-download and byte-compare the remote files. Publication errors stop the batch
runner; generated local MP3s are preserved.

## Mandatory gate — confirm EVERY app-referenced MP3 lives in Cloudflare

On the migration branch after the legacy 600-MP3 upload:

```bash
git switch feature/cloudflare-r2-audio-20261101
git pull --ff-only
node scripts/audit-cloudflare-audio.mjs
```

The read-only auditor derives **7,796 indexed utterance paths** from
`data/audio-index.json` and **600 original card MP3 paths** from the
three original flashcard JSON files, then independently lists both Cloudflare
R2 folders using local rclone credentials. Success prints `status: "PASS"`
and `allAppReferencedMp3sInR2: true` with 8,396 references. On failure it
prints missing objects and exits nonzero. The check is a file-name inventory:
it is **not proof** of byte equality or Vercel production routing.

For integrity verification, run both checks:

```bash
rclone check public/audio/utterances/ dutchtap-r2:dutchtap-audio/utterances/ --download
rclone check public/audio/flashcards/ dutchtap-r2:dutchtap-audio/flashcards/ --include '*.mp3' --download
```

The Vercel **Preview** build must have both public **Config** variables:

```text
NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL=https://pub-5d02f88f4e784eaba8df9e2b6eb77f13.r2.dev
NEXT_PUBLIC_DUTCH_AUDIO_LEGACY_R2=true
```

Redeploy Preview after saving. Open `/audio-preview`; it now reports both
audio sources separately and gives examples of the original and indexed
recordings. Both must say **Cloudflare R2** and browser Network → Media
must show R2 requests (HTTP 200 or 206). **Production remains unchanged**
until its environment variables are deliberately configured and a production
build is deployed. The `r2.dev` URL is rate-limited; use a Cloudflare
custom domain before enabling production.

Other MP3 files under `audio-batches-for-recording/clips/` are offline
source material, not served from Next.js `public/` or referenced by the
app's recording index. They are outside this live-playback migration.

## Step 4 — Later cleanup, only after verified playback

Do **not** delete MP3s, rewrite Git history, or turn on production routing during
this staging PR. When production playback, recovery, the audit and the future
generator's fresh-clone path are ready:

1. Update the audio audit/installer to use remote checks instead of requiring
   `public/audio/utterances` to be present in a fresh clone.
2. Ensure new uploads and index commits are atomic enough that missing uploads
   cannot be marked recorded.
3. On a dedicated cleanup branch, add `/public/audio/utterances/` to `.gitignore`
   and `git rm -r --cached public/audio/utterances/`. This untracks the files
   without deleting them on the operator's disk.
4. Rebuild and test Vercel Preview and Production.
5. Consider Git-history size separately. Untracking files does **not** erase
   historical blobs from Git.

## Credential hygiene

The R2 Access Key ID and Secret Key were previously posted in chat. **Revoke that
pair and use a replacement** before any further publishing. Never paste keys into
the chat, create public GitHub files containing them, or put them in
`NEXT_PUBLIC_...` variables. The public URL is safe to share; the S3 API
credentials are not.


## Verified full R2 cutover (user evidence, 2026-11-01)

The operator ran `node scripts/audit-cloudflare-audio.mjs` and reported:

```json
{"status":"PASS","allAppReferencedMp3sInR2":true,"checked":8396,"nonReferencedExtraFiles":0}
```

An authenticated Vercel Preview screenshot shows an original flashcard
`/flashcards/work-312.mp3` requested from Cloudflare, returning HTTP **304**
(cached, not an error), `Content-Type: audio/mpeg`. Previous Preview
testing confirmed indexed `/utterances/*.mp3` with HTTP 206. Both pathways
are now working in **Preview**. This does NOT prove that Vercel Production has
the correct environment variables, that every audio URL is exercised in
the browser, or that the 600 original files have been byte-compared against
their R2 copies. Keep the local and Git copies until the remaining gates pass.

### Remote-only generation and auditing

The audio scripts now accept remote-only Git clones. When audio is omitted
from `public/`, validate the entire R2 inventory **before** any paid calls:

```bash
node scripts/audit-cloudflare-audio.mjs
node scripts/audit-all-learning-audio.mjs \
  --r2-remote dutchtap-r2:dutchtap-audio
node scripts/audit-recorded-audio.mjs \
  --r2-remote dutchtap-r2:dutchtap-audio
node scripts/publish-dutch-audio-r2.mjs  # dry-run: verifies locally present MP3s
```

The publisher `--apply` uploads only locally present, SHA-256-verified
indexed MP3s and validates the complete remote inventory; it accepts remote
existing MP3s that do not exist locally. The budget runner
`--r2-remote dutchtap-r2:dutchtap-audio/utterances` runs the remote
audit **before spending** and publishes each newly generated batch.

```bash
# Existing campaign label and budget are CUMULATIVE; choose based on real credits.
node scripts/record-dutch-audio-budget.mjs \
  --account account2 --budget <CUMULATIVE_CHARACTER_BUDGET> \
  --r2-remote dutchtap-r2:dutchtap-audio/utterances --apply
```

New `public/audio/utterances/` and `public/audio/flashcards/` files are
ignored by Git, but existing Git-tracked MP3s have **not** been removed by
this change. The user must commit the **JSON index only** after remote
validation, not new MP3s. Keep local `audio-generated` and MP3 copies as
recovery backups. The end-to-end remote-only scripts have not yet been
executed in the user's WSL; do not claim that remote-only generation has
passed until it has.

### Production prerequisites

The public `r2.dev` origin is a rate-limited **development** endpoint.
Before serving production learners, add a bucket **custom domain** managed
by Cloudflare, verify direct MP3 HTTP response and correct content type,
configure the Vercel **Production** variables, then redeploy and test.
Next, create a dedicated audio-untracking PR after backing up local assets.
Do not delete old Git objects from history or remove MP3s from the existing
production branch without this validation.



## Cloudflare custom domain activated (operator screenshot, 2026-11-01)

The R2 bucket Custom Domains screen now lists **`audio.davideti.dev`** as
**Active / Enabled**. This is the intended public production audio origin.
The screenshot alone does not prove that the two public MP3 URLs return
200, or that Vercel is rebuilt with the new environment values.

Test both R2 object families from the operator's WSL machine:

```bash
for path in \
  flashcards/work-312.mp3 \
  utterances/0003d9bb40d98b32b6931297.mp3; do
  curl -sS -o /dev/null -w '%{http_code} %{content_type} %{url_effective}\n' \
    "https://audio.davideti.dev/$path"
done
```

Expected: **200 audio/mpeg** for each. For an already-cached browser response,
304 is also normal if the browser uses an ETag.

Update Vercel DutchTap **Preview / Config** values:

```text
NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL=https://audio.davideti.dev
NEXT_PUBLIC_DUTCH_AUDIO_LEGACY_R2=true
```

Redeploy `feature/cloudflare-r2-audio-20261101`: `NEXT_PUBLIC_...`
values are build-time. Verify /audio-preview and actual original/new card
Listen buttons using Network → Media. Both groups must use
`audio.davideti.dev`, not Vercel's `/audio/` or `r2.dev`.

**Do not switch Production solely by adding variables**: PR #30 is still
draft and based on PR #29, which is itself a draft based on main. The
production branch does not yet contain this migration. Review/merge the
stack before shipping a production build, retaining a rollback path.
Existing MP3s are still tracked, and remote-only publisher/integration
must be smoke-tested before untracking.
