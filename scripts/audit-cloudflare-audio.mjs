// Read-only deployment inventory gate: prove every *app-referenced MP3* exists in R2.
// The original 600 cards and the 7,796 indexed utterances live in separate folders.
// Usage: node scripts/audit-cloudflare-audio.mjs
//        node scripts/audit-cloudflare-audio.mjs --remote dutchtap-r2:dutchtap-audio
// No R2 keys in code; this uses the operator's local rclone configuration.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const index = JSON.parse(fs.readFileSync(path.join(root, 'data/audio-index.json'), 'utf8'));
if (index.version !== 1 || !index.items || Array.isArray(index.items)) throw Error('Unsupported audio index');
const args = process.argv.slice(2);
function option(flag, fallback) {
  const at = args.indexOf(flag);
  if (at < 0) return fallback;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) throw Error('Missing ' + flag);
  return value;
}
const remote = option('--remote', process.env.DUTCH_AUDIO_R2_BUCKET || 'dutchtap-r2:dutchtap-audio').replace(/\/+$/, '');
if (!/^[\w-]+:[^\s]+$/.test(remote)) throw Error('Invalid rclone remote: ' + remote);

const utterances = new Set();
for (const [id, entry] of Object.entries(index.items)) {
  if (!/^[a-f0-9]{24}$/.test(id) || entry.lang !== 'nl'
      || entry.path !== `/audio/utterances/${id}.mp3`) {
    throw Error('Unexpected indexed audio: ' + id);
  }
  utterances.add(id + '.mp3');
}
const files = ['flashcards.json', 'flashcard-additions.json', 'flashcard-additions-2.json'];
const legacy = new Set();
const counts = {};
for (const file of files) {
  const cards = JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'));
  counts[file] = cards.length;
  for (const card of cards) {
    if (!/^\/audio\/flashcards\/[a-z0-9][a-z0-9-]*\.mp3$/.test(card.audio || ''))
      throw Error('Invalid or missing original flashcard audio for ' + card.id + ' in ' + file);
    const name = path.posix.basename(card.audio);
    if (legacy.has(name)) throw Error('Duplicate original recording: ' + name);
    legacy.add(name);
  }
}
const out = { expectedIndexedUtterances: utterances.size, expectedLegacyFlashcards: legacy.size,
  totalReferencedMp3s: utterances.size + legacy.size, originalCardCounts: counts, remote };
if (legacy.size !== 600) throw Error('Expected 600 unique original flashcard recordings; found ' + legacy.size);
function rcloneFilenames(folder) {
  const proc = spawnSync('rclone', ['lsf', `${remote}/${folder}/`, '--files-only', '--include', '*.mp3'],
    { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw Error('R2 listing failed for ' + folder + ': ' + (proc.stderr || '').trim());
  return new Set(proc.stdout.trim().split('\n').filter(Boolean));
}
function verify(folder, expected) {
  const listed = rcloneFilenames(folder);
  const missing = [...expected].filter(name => !listed.has(name));
  const unexpected = [...listed].filter(name => !expected.has(name));
  console.log(JSON.stringify({folder,expected:expected.size,foundInR2:listed.size,
    missing:missing.length,unexpected:unexpected.length,
    missingExamples:missing.slice(0,10),unexpectedExamples:unexpected.slice(0,10)},null,2));
  if (missing.length) throw Error(folder + ': ' + missing.length + ' app-referenced MP3s missing in R2');
  return {found:listed.size, unexpected:unexpected.length};
}
console.log(JSON.stringify(out,null,2));
const a = verify('utterances',utterances);
const b = verify('flashcards',legacy);
console.log(JSON.stringify({status:'PASS',allAppReferencedMp3sInR2:true,
  checked:utterances.size+legacy.size,nonReferencedExtraFiles:a.unexpected+b.unexpected},null,2));
console.log('This verifies object names, not bytes/public HTTP/production env variables. Run rclone check --download and browser tests separately.');
