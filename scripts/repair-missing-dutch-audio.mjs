// One-command recovery for missing DutchTap recorded audio.
// NO PAID CALLS unless --apply is provided. Requires local ElevenLabs credentials
// and a configured rclone Cloudflare R2 remote. Never commits API keys or MP3s.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const opt = (flag,fallback) => {
  const i=args.indexOf(flag);if(i<0)return fallback;
  if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing '+flag);
  return args[i+1];
};
const limit=Number(opt('--budget','2000'));
if(!Number.isSafeInteger(limit)||limit<100||limit>28000)
  throw Error('Provide an explicit 100..28000 character budget');
const remote=opt('--remote','dutchtap-r2:dutchtap-audio');
if(!/^[A-Za-z0-9_-]+:[^\\s]+$/.test(remote))throw Error('Invalid rclone remote');
const run = (script,params=[]) => {
  const r=spawnSync(process.execPath,['scripts/'+script,...params],{stdio:'inherit'});
  if(r.error)throw r.error;
  if(r.status!==0)throw Error(script+' failed; stop and inspect. No automatic paid retry.');
};
run('prepare-unindexed-dutch-audio.mjs');
const manifestPath='audio-export/unindexed-dutch/manifest.json';
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const rows=manifest.batches.flatMap(b=>b.items);
const characters=rows.reduce((n,x)=>n+x.text.length,0);
if(!rows.length){console.log('All audited Dutch source sentences have index entries. Nothing to generate.');process.exit(0);}
if(characters>limit)throw Error('Missing '+characters+' characters exceeds your allowed budget '+limit+'. No credits spent.');
console.log(JSON.stringify({mode:apply?'PAID GENERATION + INSTALL + UPLOAD':'DRY RUN ONLY',clips:rows.length,characters,remote},null,2));
if(!apply){console.log('Review '+manifestPath+' and rerun with --apply to spend ElevenLabs credits.');process.exit(0);}
// Make sure R2 has all pre-existing recordings BEFORE charging for any new clip.
run('audit-cloudflare-audio.mjs',['--remote',remote]);
run('generate-learning-audio.mjs',['--manifest',manifestPath,'--max-characters',String(limit),'--max-clips','1000','--campaign-label','missing-dutch-20261102','--apply']);
run('install-learning-audio.mjs',['--apply','--r2-remote',remote]);
const utteranceRemote=(remote.endsWith('/') ? remote.slice(0,-1) : remote) + '/utterances';
run('publish-dutch-audio-r2.mjs',['--remote',utteranceRemote,'--apply']);
run('prepare-unindexed-dutch-audio.mjs',['--strict']);
console.log('PASS: Missing source recordings generated, installed and R2 object names verified.');
console.log('Commit and push data/audio-index.json from this branch to deploy; do not commit audio-generated/ or secrets.');
), '')+'/utterances','--apply']);
run('prepare-unindexed-dutch-audio.mjs',['--strict']);
console.log('PASS: Missing source recordings generated, installed and R2 object names verified.');
console.log('Commit and push data/audio-index.json from this branch to deploy; do not commit audio-generated/ or secrets.');
