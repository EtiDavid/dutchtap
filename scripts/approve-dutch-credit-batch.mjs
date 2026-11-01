// Compatibility helper for manifests made before the app-source auto-approval change.
// No per-row review.tsv edits: only exact DutchTap audio-audit entries can be approved.
// This authorizes existing app text for recording; it does NOT certify native idiom.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
const at=args.indexOf('--manifest');
if(at<0||!args[at+1]||args[at+1].startsWith('--'))throw Error('Provide --manifest path');
const filepath=path.resolve(args[at+1]);
const input=JSON.parse(fs.readFileSync(filepath,'utf8'));
if(input.language!=='nl'||!Array.isArray(input.batches))throw Error('Dutch audio manifest required');
const idFor=text=>createHash('sha256').update('nl\0'+text).digest('hex').slice(0,24);

const auditPath=path.join(root,'audio-export/full-coverage/missing-nl.tsv');
if(!fs.existsSync(auditPath))throw Error('First run: node scripts/audit-all-learning-audio.mjs');
const lines=fs.readFileSync(auditPath,'utf8').trimEnd().split(/\r?\n/);
if(lines.shift()!=='lang\ttext\tcharacters\troles\tapproved\tid')
 throw Error('Unexpected full audio audit header');
const audited=new Map();
for(const line of lines){
 if(!line)continue;
 const cols=line.split('\t');
 if(cols.length!==6)throw Error('Malformed full audio audit row');
 const [lang,text,characters,roles,,id]=cols;
 if(lang!=='nl'||text.length!==Number(characters)||id!==idFor(text))
   throw Error('Invalid full audio audit entry '+id);
 audited.set(id,{text,roles:roles.split(',')});
}

let approved=0,alreadyApproved=0;
const batches=input.batches.map(batch=>{
 if(!Array.isArray(batch.items))throw Error('Invalid manifest batch');
 return {...batch,items:batch.items.map(row=>{
   if(row.lang!=='nl'||typeof row.text!=='string'||row.id!==idFor(row.text))
     throw Error('Manifest text/id mismatch: '+row.id);
   const record=audited.get(row.id);
   if(!record||record.text!==row.text)
     throw Error('Not an exact missing DutchTap audio-audit target: '+row.id);
   if(!Array.isArray(row.roles)||!row.roles.every(role=>record.roles.includes(role)))
     throw Error('Roles differ from source-content audit for '+row.id);
   if(row.approved)alreadyApproved++;
   else approved++;
   return {...row,approved:true,review:'Auto-authorized for recording from exact DutchTap app content; no independent native-language certification'};
 })};
});
const output={...input,approvedOnly:true,
 provenance:'Existing exact DutchTap source-content audit; auto-authorized for audio, not independently native-speaker certified.',
 batches};
const all=batches.flatMap(b=>b.items);
console.log(JSON.stringify({verifiedFromApp:all.length,alreadyApproved,newlyAutoApproved:approved,
 pending:0,approvedCharacters:all.reduce((n,row)=>n+row.text.length,0)},null,2));
if(args.includes('--apply')){
 const dest=path.join(path.dirname(filepath),'approved-manifest.json');
 fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
 console.log('Wrote '+dest+' (no manual TSV approval required).');
}
