// Install only approved, checksummed generated MP3s; preserve all existing audio and index entries.
// Usage: node scripts/install-learning-audio.mjs [--apply]
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'audio-generated');
const state = JSON.parse(await fs.readFile(path.join(source, 'generation-state.json'), 'utf8'));
const indexPath = path.join(root, 'data/audio-index.json');
const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
if (index.version !== 1 || !index.items || Array.isArray(index.items)) throw Error('Unsupported audio index.');
const hash = (data) => createHash('sha256').update(data).digest('hex');
const targetDir = path.join(root, 'public/audio/utterances');
const apply = process.argv.includes('--apply');
// A remote-only Git clone intentionally has no historical MP3s. Verify every
// existing indexed recording against R2 rather than silently regenerating it.
const remoteArg = process.argv.indexOf('--r2-remote');
if (remoteArg !== -1 && (!process.argv[remoteArg + 1] || process.argv[remoteArg + 1].startsWith('--')))
  throw Error('Expected R2 bucket root after --r2-remote');
const r2Root = remoteArg !== -1 ? process.argv[remoteArg + 1].replace(/\/+$/, '') : '';
if (r2Root && !/^[a-zA-Z0-9_-]+:[^\s]+$/.test(r2Root)) throw Error('Invalid R2 bucket root');
let remoteFiles = null;
if (r2Root) {
  const run = spawnSync('rclone', ['lsf',r2Root+'/utterances/','--files-only','--include','*.mp3'],
    {cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
  if (run.error) throw run.error;
  if (run.status !== 0) throw Error('Cannot verify R2 inventory: '+(run.stderr||'').trim());
  remoteFiles = new Set(run.stdout.trim().split('\n').filter(Boolean));
  for (const [id, item] of Object.entries(index.items)) {
    if (item.path !== '/audio/utterances/'+id+'.mp3' || !remoteFiles.has(id+'.mp3'))
      throw Error('Existing indexed MP3 missing from R2. Publish before installing: '+id);
  }
}
const install = []; let already = 0, unapproved = 0;
for (const [id, entry] of Object.entries(state.clips)) {
  if (entry.lang !== 'nl' || entry.approved !== true) { unapproved++; continue; }
  if (!/^[a-f0-9]{24}$/.test(id) || id !== hash('nl\0' + entry.text).slice(0, 24)) throw Error('Invalid ID: ' + id);
  const data = await fs.readFile(path.join(source, id + '.mp3'));
  if (hash(data) !== entry.checksum) throw Error('Checksum mismatch: ' + id);
  const dest = path.join(targetDir, id + '.mp3');
  const item = { text: entry.text, lang: 'nl', path: '/audio/utterances/' + id + '.mp3', checksum: entry.checksum };
  let existing;
  try { existing = await fs.readFile(dest); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (existing && hash(existing) !== entry.checksum) throw Error('Refusing to overwrite different existing MP3: ' + id);
  if (index.items[id]) {
    if (JSON.stringify(index.items[id]) !== JSON.stringify(item)) throw Error('Existing audio index entry differs: ' + id);
    if (!existing && !remoteFiles?.has(id + '.mp3')) throw Error('Index references a recording missing both locally and on R2: ' + id);
    already++; continue;
  }
  if (existing) throw Error('Existing MP3 has no matching index entry: ' + id);
  install.push({ id, data, dest, item });
}
console.log(JSON.stringify({ mode: apply ? 'INSTALL' : 'DRY RUN', toInstall: install.length, alreadyInstalled: already, skippedUnapproved: unapproved, existingIndexEntries: Object.keys(index.items).length }, null, 2));
if (!apply) process.exit(0);
await fs.mkdir(targetDir, { recursive: true });
for (const row of install) {
  await fs.writeFile(row.dest, row.data, { flag: 'wx' });
  index.items[row.id] = row.item;
}
await fs.writeFile(indexPath + '.part', JSON.stringify(index, null, 2) + '\n');
await fs.rename(indexPath + '.part', indexPath);
console.log('Installed approved audio without deleting or replacing older files.');
