# Dutch at Work update

Adds 600 Dutch workplace parents (60 in each of ten areas), alongside the original 600. In Create session, choose Collection → Dutch at Work → a workplace area. The old Work topic remains in Everyday. New cards use your device's Dutch voice and intentionally have no pictures or recordings.

Requires a clean Git checkout at `1f353b78e6db247011ed383d4544c1d6a5c84761`, Git and Python 3. Run from the extracted package folder in a terminal. On WSL/Linux:

```bash
python3 install.py /path/to/dutchtap
python3 install.py /path/to/dutchtap --apply
```

The first command only checks compatibility. The second applies the patch and verifies every changed file. On Windows, `python` may replace `python3`; pass your actual repository path. Do not change your repository's revision merely to satisfy this installer: if it refuses a different version, integrate the patch in a separate compatible checkout or review it manually.

The installer refuses a different HEAD, tracked modifications/conflicts, untracked files at new destinations, symlink destinations, checksum mismatches and patches that do not apply cleanly. Unrelated untracked files are left alone. It never resets, stashes, commits, pushes, deploys, installs dependencies or touches a database. Applied changes remain uncommitted for review. It does not migrate or reset localStorage, cookies, user accounts, saved levels or sessions.

After applying, use the repository's existing dependencies and workflow:

```bash
npm ci
npm run content:workplace
npm test
npm run lint
npm run assets:flashcards -- --complete
npm run build
E2E_PORT=3114 npm run test:flashcards
```

The browser suite uses isolated fixtures and mocked account/session endpoints. Seven optional MongoDB unit checks require a separately configured local test database; the installer does not configure one. No ElevenLabs key is required. Dutch speech needs an installed Dutch device voice; without one, reading and practice remain available and the app explains how to install a voice. Belgian Dutch is preferred when available, subject to your saved Dutch voice preference.

Package contents: `update.patch`, complete changed files in `files/`, `MANIFEST.json` with SHA-256 checksums, `install.py`, and this README. Do not copy `files/` over an active checkout as a substitute for the compatibility checks. Review reports are in `files/docs/workplace/`. There are 6,000 child entries backed by 720 distinct authored child sentences, intentionally shared within related workplace situations. Language review is AI editorial review, not independent native-speaker certification.
