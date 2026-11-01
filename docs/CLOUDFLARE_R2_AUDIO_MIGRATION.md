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

## Step 2 — Deploy a reversible client routing change

Only **indexed** `/audio/utterances/<24-hex-id>.mp3` files are redirected.
Legacy word/flashcard audio and French remain unchanged.
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
