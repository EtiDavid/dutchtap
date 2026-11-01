// Publish installed, exact-text Dutch MP3s to Cloudflare R2 through local rclone.
// No S3 credentials enter this project. Nothing is deleted locally or remotely.
//   node scripts/publish-dutch-audio-r2.mjs
//   node scripts/publish-dutch-audio-r2.mjs --apply
//   node scripts/publish-dutch-audio-r2.mjs --apply --deep-check
//   node scripts/publish-dutch-audio-r2.mjs --remote my-r2:bucket/utterances --apply
import fs from 'node:fs';
import path from 'node:path';
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
const remote = opt('--remote', process.env.DUTCH_AUDIO_R2_REMOTE || 'dutchtap-r2:dutchtap-audio/utterances');
const apply = args.includes('--apply');
const deepCheck = args.includes('--deep-check');
if (!/^[\w-]+:[^\s]+\/utterances\/?$/.test(remote)) throw Error('Remote must end in bucket/utterances: ' + remote);
if (index.version !== 1 || !index.items) throw Error('Unsupported Dutch audio index');
if (!fs.existsSync(source)) throw Error('Local recordings missing. Keep local files for upload and recovery.');

const entries = Object.entries(index.items);
for (const [id, item] of entries) {
  if (item.lang !== 'nl' || !/^[a-f0-9]{24}$/.test(id)
      || item.path !== `/audio/utterances/${id}.mp3`) throw Error('Unexpected audio index entry: ' + id);
  if (!fs.statSync(path.join(source, id + '.mp3'), { throwIfNoEntry: false })?.isFile())
    throw Error('Missing local recording: ' + id + '.mp3');
}
console.log(JSON.stringify({mode: apply ? 'UPLOAD' : 'DRY RUN', remote, indexedClips: entries.length, check: deepCheck ? 'download-and-compare' : 'file sizes'}, null, 2));
if (!apply) {
  console.log('Dry run only. Add --apply to upload, then verify the remote.');
  process.exit(0);
}
function run(params) {
  const proc = spawnSync('rclone', params, { cwd: root, stdio: 'inherit' });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw Error('rclone failed (exit ' + proc.status + '): ' + params[0]);
}
run(['copy', source, remote, '--transfers', '8', '--checkers', '16', '--progress']);
run(['check', source, remote, ...(deepCheck ? ['--download'] : ['--size-only'])]);
console.log('R2 publish verified. Local recordings and Git-tracked assets were NOT removed.');
