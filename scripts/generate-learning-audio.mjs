// Resumable, budget-limited Dutch-only ElevenLabs generator. Dry-run by default.
// Node 20.12+. Never stores credentials or installs unreviewed clips into the app.
import { loadEnvFile } from 'node:process';
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const file of ['.env', '.env.local']) {
  try { loadEnvFile(path.join(root, file)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw Error('Missing value for ' + name);
  return args[index + 1];
};
const number = (name, fallback) => {
  const value = Number(option(name, String(fallback)));
  if (!Number.isSafeInteger(value) || value < 1) throw Error('Invalid positive integer: ' + name);
  return value;
};
const apply = args.includes('--apply');
const includeUnreviewed = args.includes('--include-unreviewed');
const maxCharacters = number('--max-characters', 1000);
const maxClips = number('--max-clips', 5);
const manifestPath = path.resolve(option('--manifest', path.join(root, 'audio-export', 'manifest.json')));
const output = path.resolve(option('--out', path.join(root, 'audio-generated')));
const voice = process.env.ELEVENLABS_VOICE_ID;
const key = process.env.ELEVENLABS_API_KEY;
const model = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const settings = { stability: 0.65, similarity_boost: 0.75, speed: 0.9 };
const sha = (value) => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.language !== 'nl') throw Error('Only Dutch (nl) manifests are supported.');
if (!manifest.approvedOnly && !includeUnreviewed)
  throw Error('Unreviewed manifest: use an approved-only export, or explicitly add --include-unreviewed after checking the content.');
if (!voice || !/^[a-zA-Z0-9_-]+$/.test(voice)) throw Error('Set ELEVENLABS_VOICE_ID in .env.');
if (apply && !key) throw Error('Set ELEVENLABS_API_KEY in .env.');
if (apply && maxCharacters > 14000) throw Error('Per-run safety cap: --max-characters cannot exceed 14000.');
const rows = manifest.batches.flatMap((batch) => batch.items);
const seen = new Set();
const candidates = [];
for (const row of rows) {
  if (row.lang !== 'nl' || row.id !== sha('nl\\0' + row.text).slice(0, 24))
    throw Error('Manifest text/id mismatch: ' + row.id);
  if (seen.has(row.id)) continue;
  seen.add(row.id);
  candidates.push(row);
}
const statePath = path.join(output, 'generation-state.json');
let state = { version: 1, clips: {} };
try { state = JSON.parse(await readFile(statePath, 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
const selected = [];
let chars = 0, skipped = 0;
for (const row of candidates) {
  const body = { text: row.text, model_id: model, voice_settings: settings };
  const fingerprint = sha(JSON.stringify({ voice, body }));
  const target = path.join(output, row.id + '.mp3');
  const saved = state.clips[row.id];
  let valid = false;
  if (saved?.fingerprint === fingerprint) {
    try {
      const bytes = await readFile(target);
      valid = bytes.length > 100 && sha(bytes) === saved.checksum;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  if (valid) { skipped++; continue; }
  try {
    if ((await stat(target)).size > 0) throw Error('Existing clip has unknown settings: ' + target);
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (selected.length >= maxClips || chars + row.text.length > maxCharacters) break;
  selected.push({ row, body, fingerprint, target });
  chars += row.text.length;
}
console.log(JSON.stringify({ mode: apply ? 'PAID GENERATION' : 'DRY RUN', model, voice, approvedOnly: manifest.approvedOnly, selected: selected.length, characters: chars, skipped, maxCharacters, maxClips, output }, null, 2));
if (!apply) process.exit(0);
await mkdir(output, { recursive: true });
for (const { row, body, fingerprint, target } of selected) {
  // Never retry a POST automatically: an interrupted response might still incur charges.
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voice) + '?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) throw Error('Stopped at ' + row.id + ' (HTTP ' + response.status + '). Previous files remain saved.');
  if (!response.headers.get('content-type')?.includes('audio/')) throw Error('Unexpected response content type for ' + row.id);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100 || bytes.toString('ascii', 0, 3) !== 'ID3' && (bytes[0] !== 0xff || (bytes[1] & 0xe0) !== 0xe0))
    throw Error('Invalid MP3 returned for ' + row.id);
  await writeFile(target + '.part', bytes);
  await rename(target + '.part', target);
  state.clips[row.id] = { text: row.text, lang: 'nl', voice, model, settings, fingerprint, checksum: sha(bytes), generatedAt: new Date().toISOString(), approved: row.approved, roles: row.roles };
  await writeFile(statePath + '.part', JSON.stringify(state, null, 2) + '\\n');
  await rename(statePath + '.part', statePath);
  console.log('Saved ' + row.id + '.mp3 (' + row.text.length + ' characters)');
}
console.log('Finished. Review recordings before installing them in DutchTap.');
