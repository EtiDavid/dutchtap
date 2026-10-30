// Paid, resumable 500-item DutchTap audio campaign. Run locally, never from CI.
// Usage: npm run audio:workplace500:full -- --apply --push
import { spawnSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const apply = process.argv.includes('--apply');
const push = process.argv.includes('--push');
const campaign = 'audio/workplace-500-20261030';
const expectedVoice = '9kBSa5emtWArU7U0792v';
const reportDir = path.join(root, 'audio-generated');
const stateFile = path.join(reportDir, 'generation-state.json');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const run = (name, args) => {
  console.log('\n> ' + name + ' ' + args.join(' '));
  const r = spawnSync(name, args, { cwd: root, stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw Error(`${name} exited with status ${r.status}; progress is saved, rerun this command to resume.`);
};
const getCompleted = () => {
  if (!fs.existsSync(stateFile)) return new Set();
  const state = read(stateFile);
  const result = new Set();
  for (const [id, x] of Object.entries(state.clips || {})) {
    const fp = path.join(reportDir, `${id}.mp3`);
    if (x.approved && fs.existsSync(fp) && fs.statSync(fp).size > 100 &&
        createHash('sha256').update(fs.readFileSync(fp)).digest('hex') === x.checksum) result.add(id);
  }
  return result;
};
const main = async () => {
  if (!apply) throw Error('Explicit paid-generation approval required: add --apply.');
  if (process.platform !== 'linux' && process.platform !== 'darwin') console.log('Running on', process.platform);
  const branch = spawnSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' });
  if (branch.status !== 0 || branch.stdout.trim() !== campaign)
    throw Error('Checkout ' + campaign + ' before generating audio.');
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (status.status !== 0 || status.stdout.trim())
    throw Error('Uncommitted tracked/untracked changes detected. Commit/stash them first; ignored .env/audio output is safe.');
  for (const file of ['.env', '.env.local']) {
    try { loadEnvFile(path.join(root, file)); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  if (!process.env.ELEVENLABS_API_KEY) throw Error('ELEVENLABS_API_KEY missing in local .env/.env.local');
  if (process.env.ELEVENLABS_VOICE_ID !== expectedVoice) throw Error('Voice does not match the tested Diederik voice ID.');
  if ((process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2') !== 'eleven_multilingual_v2')
    throw Error('Expected eleven_multilingual_v2; refusing unexpected model or pricing.');
  const list = read(path.join(root, 'data/editorial/audio-workplace-500-review.json')).rows;
  const expectedCharacters = list.reduce((n, x) => n + x.dutch.length, 0);
  if (list.length !== 500 || expectedCharacters !== 24017 || list.some(x => !x.approvedForRecording))
    throw Error('Campaign not fully approved, or selected sentences changed unexpectedly.');
  run('node', ['scripts/export-approved-workplace-500.mjs']);
  const manifest = path.join(root, 'audio-export/workplace-500/manifest.json');
  const plan = read(manifest);
  const selected = plan.batches.flatMap((b) => b.items);
  const indexed = read(path.join(root, 'data/audio-index.json'));
  const installedTexts = new Set(Object.values(indexed.items).filter(item => item.lang === 'nl').map(item => item.text));
  const alreadyInstalled = list.filter(x => installedTexts.has(x.dutch));
  if (selected.length !== 500 - alreadyInstalled.length || selected.some((x) => !x.approved || x.lang !== 'nl'))
    throw Error('Approved manifest does not match uninstalled campaign recordings.');
  const targetIDs = new Set(selected.map((x) => x.id));
  const completed = () => new Set([...getCompleted()].filter((id) => targetIDs.has(id)));
  const todo = () => selected.filter((x) => !completed().has(x.id));
  console.log('Campaign: 500 approved; installed: ' + alreadyInstalled.length +
    '; generated locally: ' + completed().size + '; waiting: ' + todo().length);
  async function credits() {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('Subscription read not permitted for this API key; relying on the user-provided screenshot of 30,574 credits.');
        return null;
      }
      throw Error('Unable to check ElevenLabs credit balance (HTTP ' + response.status + ')');
    }
    const info = await response.json();
    const available = Number(info.character_limit) - Number(info.character_count);
    if (!Number.isFinite(available)) {
      console.warn('Subscription response does not contain a usable credit balance.');
      return null;
    }
    return Math.max(0, available);
  }
  const initialRemaining = todo().reduce((n,x) => n + x.text.length, 0);
  let remainingCredits = initialRemaining ? await credits() : null;
  if (remainingCredits !== null && remainingCredits < initialRemaining + 500)
    throw Error('Insufficient credits for remaining ' + initialRemaining +
      ' characters plus reserve: ' + remainingCredits + ' available. No paid requests made.');
  console.log('Expected generation cost:', initialRemaining, 'credits at 1 per character.');
  // Sequential chunks. The existing generator writes each MP3 and checksum before proceeding.
  for (let group = 1; group <= 5 && todo().length; group++) {
    const nextHundred = todo().slice(0, 100);
    const chunkCharacters = nextHundred.reduce((n,x) => n + x.text.length, 0);
    remainingCredits = await credits();
    if (remainingCredits !== null && remainingCredits < chunkCharacters + 500)
      throw Error('Stopping safely: ' + remainingCredits +
        ' available; next group needs about ' + chunkCharacters + ' credits plus reserve.');
    console.log('\n=== Paid group ' + group + '/5 (' + nextHundred.length +
      ' clips, ~' + chunkCharacters + ' credits) ===');
    run('node', ['scripts/generate-learning-audio.mjs', '--apply', '--manifest', manifest,
      '--max-clips', '100', '--max-characters', '7000']);
    console.log('Verified generated clips:', completed().size, '/', selected.length);
  }
  if (todo().length) throw Error(todo().length + ' clips remain; rerun this command to resume.');
  console.log('\nAll 500 approved files generated. Installing into app index...');
  run('node', ['scripts/install-learning-audio.mjs']);
  run('node', ['scripts/install-learning-audio.mjs', '--apply']);
  run('node', ['scripts/audit-recorded-audio.mjs']);
  run('npm', ['test']);
  run('npm', ['run', 'build']);
  run('npm', ['run', 'test:flashcards']);
  run('npm', ['run', 'test:prod']);
  console.log('\nAudio installed and all validations passed.');
  if (push) {
    run('git', ['add', '--', 'data/audio-index.json', 'public/audio/utterances']);
    const stage = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: root });
    if (stage.status === 1) {
      run('git', ['commit', '-m', 'Add 500 reviewed Flemish workplace audio clips']);
      run('git', ['push', 'origin', 'HEAD:' + campaign]);
    } else if (stage.status !== 0) throw Error('Unable to inspect staged audio changes.');
    console.log('Audio branch updated on GitHub. PR #28 remains draft; no merge or production deploy.');
  } else console.log('Use git add/commit/push to submit the generated audio for review.');
};
main().catch((e) => { console.error('\nSTOP:', e.message); process.exitCode = 1; });
