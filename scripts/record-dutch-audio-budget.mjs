// Run multiple DutchTap ElevenLabs batches against a user-chosen PER-ACCOUNT
// character allowance. No account-balance endpoint is called; each credit
// spend remains limited by the operator's explicit --budget and --apply.
// Existing MP3s and installed index entries are never regenerated.
// Syntax:
//   node scripts/record-dutch-audio-budget.mjs --account account1-rest --budget 24000
//   node scripts/record-dutch-audio-budget.mjs --account account1-rest --budget 24000 --apply
import {loadEnvFile} from 'node:process';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
// Like the paid generator, local shell variables win; .env.local wins over .env.
for(const name of ['.env.local','.env']) {
 try{loadEnvFile(path.join(root,name));}
 catch(e){if(e.code!=='ENOENT')throw e;}
}
const args=process.argv.slice(2);
const option=(name,fallback)=>{
 const i=args.indexOf(name);
 if(i<0)return fallback;
 if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing '+name);
 return args[i+1];
};
const account=option('--account','');
const budget=Number(option('--budget','0'));
const apply=args.includes('--apply');
if(!/^[a-zA-Z0-9_-]+$/.test(account))throw Error('Use --account with a simple unique label for each ElevenLabs account.');
if(!Number.isSafeInteger(budget)||budget<100)throw Error('Provide --budget with a positive character allowance (at least 100).');
const generatedDir=path.join(root,'audio-generated');
const statePath=path.join(generatedDir,'generation-state.json');
const bindingPath=path.join(generatedDir,'campaign-account-bindings.json');
const auditPath=path.join(root,'audio-export/full-coverage/audit.json');
const manifestPath=path.join(root,'audio-export/credit-'+account,'manifest.json');
const hash=value=>createHash('sha256').update(value).digest('hex');
const key=process.env.ELEVENLABS_API_KEY;
function readJson(file,fallback){
 try{return JSON.parse(fs.readFileSync(file,'utf8'));}
 catch(e){if(e.code==='ENOENT')return fallback;throw e;}
}
function usage(){
 const clips=Object.values(readJson(statePath,{clips:{}}).clips||{});
 const mine=clips.filter(row=>row.campaignLabel===account);
 return {clips:mine.length,characters:mine.reduce((n,row)=>n+row.text.length,0)};
}
function run(script,params){
 const proc=spawnSync(process.execPath,[path.join(root,'scripts',script),...params],
   {cwd:root,env:process.env,stdio:'inherit'});
 if(proc.error)throw proc.error;
 return proc.status===0;
}
if(apply){
 if(!key)throw Error('Set ELEVENLABS_API_KEY in .env.local (or your environment).');
 fs.mkdirSync(generatedDir,{recursive:true});
 const fingerprints=readJson(bindingPath,{});
 const fingerprint=hash(key);
 if(fingerprints[account]&&fingerprints[account]!==fingerprint)
   throw Error('This campaign label was previously used with a different API key. Use its original key or a different account label.');
 for(const [label,prior] of Object.entries(fingerprints)){
   if(label!==account&&prior===fingerprint)
     throw Error('This API key is already assigned to campaign '+label+'. Switch to the other account key before starting a second campaign.');
 }
 if(!fingerprints[account]){
   fingerprints[account]=fingerprint;
   fs.writeFileSync(bindingPath,JSON.stringify(fingerprints,null,2)+'\n',{mode:0o600});
 }
}
let iteration=0;
while(iteration++<100){
 const used=usage();
 const remaining=budget-used.characters;
 console.log(JSON.stringify({campaign:account,mode:apply?'PAID':'DRY RUN',budgetCharacters:budget,
   alreadyGeneratedThisCampaign:used,remainingCharacterAllowance:remaining},null,2));
 if(remaining<100){
   console.log('Account campaign allowance reached; no additional TTS requests.');
   break;
 }
 if(!run('audit-all-learning-audio.mjs',[]))
   throw Error('Audio audit failed; stopping without generating further clips.');
 const audit=readJson(auditPath,{});
 const missing=audit.languages?.nl?.missing;
 if(!missing||!Number.isInteger(missing.uniqueUtterances))
   throw Error('Could not read the Dutch missing-audio count from the audit.');
 if(missing.uniqueUtterances===0){
   console.log('All Dutch source-audit targets have recorded audio. Campaign complete.');
   break;
 }
 const limit=Math.min(28000,remaining);
 if(!run('prepare-dutch-credit-batch.mjs',['--label',account,'--budget',String(limit)]))
   throw Error('Batch preparation failed; no paid API calls made in this iteration.');
 const manifest=readJson(manifestPath,null);
 const items=manifest?.batches?.flatMap(batch=>batch.items)||[];
 const chars=items.reduce((n,row)=>n+row.text.length,0);
 if(!items.length||chars<1||chars>limit||items.length>1000||!manifest.approvedOnly)
   throw Error('Unsafe or empty generated manifest: stop before spending credits.');
 console.log(JSON.stringify({nextBatch:iteration,items:items.length,
   plannedCharacters:chars,missingBeforeBatch:missing.uniqueUtterances},null,2));
 if(!apply){
   console.log('Dry-run complete. Repeat the command with --apply to generate and install audio.');
   break;
 }
 const success=run('generate-learning-audio.mjs',[
   '--manifest',manifestPath,'--max-characters',String(limit),
   '--max-clips','1000','--campaign-label',account,'--apply']);
 // Install completed clips even if the network fails partway through a batch.
 if(!run('install-learning-audio.mjs',['--apply']))
   throw Error('Audio installation failed; generated MP3s remain on disk for recovery.');
 if(!success)
   throw Error('Audio generation stopped (possibly API credits/permission/network). Completed clips were installed; rerun the same campaign command to resume.');
 const now=usage();
 if(now.characters<=used.characters)
   throw Error('No new MP3s were generated. Stopping to avoid a repeated batch.');
}
if(iteration>100)throw Error('Maximum campaign rounds reached; inspect the audit before continuing.');
if(apply){
 if(!run('audit-all-learning-audio.mjs',[]))throw Error('Final audit failed.');
}
console.log(JSON.stringify({campaign:account,finished:true,spentCharacterAllowance:usage().characters,
  recordedClipsInCampaign:usage().clips,characterAllowance:budget},null,2));
