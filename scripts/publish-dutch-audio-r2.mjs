// Upload only locally present, checksummed indexed Dutch MP3s to Cloudflare R2.
// Works on a fresh Git clone with zero old MP3s; no credentials in source.
// Dry run by default; never deletes local or remote data.
// Usage: node scripts/publish-dutch-audio-r2.mjs [--apply] [--deep-check]
//        node scripts/publish-dutch-audio-r2.mjs --remote dutchtap-r2:dutchtap-audio/utterances --apply
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'public/audio/utterances');
const index = JSON.parse(fs.readFileSync(path.join(root, 'data/audio-index.json'), 'utf8'));
const args = process.argv.slice(2);
function opt(flag, fallback) {
  const at = args.indexOf(flag);
  if (at < 0) return fallback;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) throw Error('Missing value for ' + flag);
  return value;
}
const remote = opt('--remote', process.env.DUTCH_AUDIO_R2_REMOTE || 'dutchtap-r2:dutchtap-audio/utterances').replace(/\/+$/, '');
const apply = args.includes('--apply');
const deepCheck = args.includes('--deep-check');
if (!/^[a-zA-Z0-9_-]+:[^\s]+\/utterances$/.test(remote))
  throw Error('Remote must end in bucket/utterances: ' + remote);
if (index.version !== 1 || !index.items || Array.isArray(index.items))
  throw Error('Unsupported Dutch audio index');

const hash = buf => createHash('sha256').update(buf).digest('hex');
const expected = new Set();
for (const [id, entry] of Object.entries(index.items)) {
  if (!/^[a-f0-9]{24}$/.test(id) || entry.lang !== 'nl'
      || entry.path !== '/audio/utterances/' + id + '.mp3')
    throw Error('Invalid indexed audio entry: ' + id);
  if (id !== hash('nl\0' + entry.text).slice(0,24))
    throw Error('Indexed text does not match ID: ' + id);
  expected.add(id + '.mp3');
}
const present = fs.existsSync(source)
  ? fs.readdirSync(source).filter(name => name.endsWith('.mp3'))
  : [];
for (const name of present) {
  if (!expected.has(name)) throw Error('Unindexed local recording: ' + name);
  const data = fs.readFileSync(path.join(source,name));
  const id = name.slice(0,-4);
  if (hash(data) !== index.items[id].checksum)
    throw Error('Local recording checksum mismatch: ' + name);
}
console.log(JSON.stringify({
  mode: apply ? 'PUBLISH + R2 INVENTORY VERIFY' : 'DRY RUN',
  remote, indexedMp3s: expected.size, locallyAvailableMp3s: present.length,
  remoteOnlyMp3s: expected.size - present.length,
  contentCheck: deepCheck ? 'download all locally present files and compare' : 'size check on locally present files'
}, null, 2));
if (!apply) {
  console.log('Dry run complete. Use --apply to upload and validate complete Cloudflare inventory.');
  process.exit(0);
}
function run(params) {
  const proc = spawnSync('rclone', params, {cwd:root,stdio:'inherit'});
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw Error('rclone '+params[0]+' failed (exit '+proc.status+')');
}
if (present.length) {
  run(['copy',source,remote,'--include','*.mp3','--transfers','8','--checkers','16','--progress']);
  // --one-way tolerates remote-only old clips on a fresh Git clone.
  run(['check',source,remote,'--include','*.mp3','--one-way',
    ...(deepCheck ? ['--download'] : ['--size-only'])]);
}
// Also confirm every indexed AND original flashcard MP3 has an object on R2.
const rootRemote = remote.slice(0, -'/utterances'.length);
const verify = spawnSync(process.execPath,
  [path.join(root,'scripts/audit-cloudflare-audio.mjs'),'--remote',rootRemote],
  {cwd:root,stdio:'inherit'});
if (verify.error) throw verify.error;
if (verify.status !== 0)
  throw Error('Full R2 audit failed. Local generated files were preserved; DO NOT commit a newly expanded audio index until the remote objects are uploaded.');
console.log('Cloudflare R2 inventory verified. Nothing deleted locally or remotely.');
