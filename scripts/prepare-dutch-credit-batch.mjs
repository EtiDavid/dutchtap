// Plan a credit-bounded, DUTCH-ONLY batch from existing AI-edited DutchTap content.
// No paid API calls. Skip clips already indexed or safely generated locally.
// Only text present in the full audio audit can be selected.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));
const args=process.argv.slice(2);
const arg=(flag,fallback)=>{const i=args.indexOf(flag);return i<0?fallback:args[i+1]};
const label=arg('--label','account-1');
const budget=Number(arg('--budget','18500'));
if(!/^[a-zA-Z0-9_-]+$/.test(label))throw Error('Invalid label');
if(!Number.isSafeInteger(budget)||budget<100||budget>28000)throw Error('Budget must be 100..28000 characters');
const base=path.join(root,'audio-export/full-coverage');
const missingPath=path.join(base,'missing-nl.tsv');
if(!fs.existsSync(missingPath))throw Error('First run: node scripts/audit-all-learning-audio.mjs');
const index=data('audio-index.json');
const recorded=new Set(Object.keys(index.items));
const missing=new Set(fs.readFileSync(missingPath,'utf8').split(/\r?\n/).slice(1)
 .filter(Boolean).map(line=>line.split('\t').at(-1)));
const output=path.join(root,'audio-export/credit-'+label);
const cache=path.join(root,'audio-generated');
const stateFile=path.join(cache,'generation-state.json');
let savedState={};
if(fs.existsSync(stateFile)){
 const raw=fs.readFileSync(stateFile,'utf8').trimEnd().replace(/\\n$/,'');
 savedState=JSON.parse(raw).clips||{};
}
const idFor=text=>createHash('sha256').update('nl\0'+text).digest('hex').slice(0,24);
const sha=b=>createHash('sha256').update(b).digest('hex');
let skippedSaved=0,skippedIndexed=0,skippedOutsideAudit=0;
const candidates=[],seen=new Set();
function add(text,role,source){
 if(typeof text!=='string'||!text.trim()||text!==text.trim()||/[\n\r\t…]/.test(text))return;
 const id=idFor(text);
 if(seen.has(id))return;
 seen.add(id);
 if(recorded.has(id)){skippedIndexed++;return}
 const saved=savedState[id];
 if(saved){
   const file=path.join(cache,id+'.mp3');
   if(fs.existsSync(file) && sha(fs.readFileSync(file))===saved.checksum){skippedSaved++;return}
   throw Error('Clip state is unresolved; inspect before spending credits: '+id);
 }
 if(!missing.has(id)){skippedOutsideAudit++;return}
 candidates.push({id,lang:'nl',text,roles:[role],source,
   approved:true,existingAudio:'',
   review:'Accepted for recording from existing AI-edited app content; not independently native reviewed'});
}
const lessons=data('grammar-topic-lessons.json');
const topicQueues=new Map();
for(const [topic,lesson] of Object.entries(lessons)){
 if(!/AI.edit/i.test(lesson.status||''))throw Error('Lesson lacks AI-editorial status: '+topic);
 const lines=[];
 for(const section of lesson.sections||[])for(const example of section.examples||[])lines.push(example.nl);
 topicQueues.set(topic,[...new Set(lines)]);
}
const words=[];
function putWord(text,role,source){if(typeof text==='string'&&text.trim())words.push({text,role,source})}
for(const name of ['workplace-vocabulary.json','vocabulary.json']){
 for(const word of data(name)){
  putWord((word.article?word.article+' ':'')+word.headword,'word:'+word.id,name);
  if(word.plural&&word.plural!==word.headword)putWord(word.plural,'plural:'+word.id,name);
 }
}
const nouns=fs.readFileSync(path.join(root,'data/nouns.ts'),'utf8');
for(const match of nouns.matchAll(/\{ id: "([^"]+)", singular: "([^"]+)", article: "([^"]+)", plural: "([^"]+)"/g)){
 putWord(match[3]+' '+match[2],'game-noun:'+match[1],'nouns.ts');
 if(match[4]!==match[2])putWord('de '+match[4],'game-plural:'+match[1],'nouns.ts');
}
const adjectives=fs.readFileSync(path.join(root,'data/adjectives.ts'),'utf8');
for(const match of adjectives.matchAll(/\{ id: "([^"]+)", base: "([^"]+)", eForm: "([^"]+)"/g)){
 putWord(match[2],'game-adjective:'+match[1],'adjectives.ts');
 putWord(match[3],'game-adjective-e:'+match[1],'adjectives.ts');
}
for(const word of words)add(word.text,word.role,word.source);
const wordCandidates=[...candidates];candidates.length=0;seen.clear();
for(const [topic,group] of topicQueues)
 for(const text of group)add(text,'lesson-example:'+topic,'grammar-topic-lessons.json');
const lessonCandidates=[...candidates];candidates.length=0;seen.clear();
// Fill subsequent credit batches with authored grammar cards that have matching
// per-card AI-editorial analysis. These sentences are already present in DutchTap;
// the analysis status is NOT independent native-speaker certification.
const analyses=new Map();
for(const filename of fs.readdirSync(path.join(root,'data')).filter(x=>/^grammar-.*-analysis\.json$/.test(x))){
 for(const [cardId,record] of Object.entries(data(filename).cards||{})){
   if(record.status==='ai-editorial-checked')analyses.set(cardId,record);
 }
}
let grammarEligible=0,grammarMissingAnalysis=0;
for(const card of data('grammar-pattern-cards.json')){
 if(!analyses.has(card.id)){grammarMissingAnalysis++;continue}
 grammarEligible++;
 add(card.dutch,'grammar-card:'+card.category,'grammar-pattern-cards.json');
}
const grammarCandidates=[...candidates];candidates.length=0;seen.clear();

const selected=[],picked=new Set();let characters=0;
function choose(row){
 if(picked.has(row.id)||characters+row.text.length>budget)return false;
 picked.add(row.id);characters+=row.text.length;selected.push(row);return true;
}
const wordReserve=Math.floor(budget*0.30);
for(const row of wordCandidates){
 if(characters+row.text.length>wordReserve)continue;
 choose(row);
}
const groups=new Map();
for(const row of lessonCandidates){
 const topic=row.roles[0].split(':')[1];
 if(!groups.has(topic))groups.set(topic,[]);
 groups.get(topic).push(row);
}
let progressed=true;
while(progressed){
 progressed=false;
 for(const group of groups.values())if(group.length){
  if(choose(group.shift()))progressed=true;
 }
}
const grammarGroups=new Map();
for(const row of grammarCandidates){
 const topic=row.roles[0].split(':')[1];
 if(!grammarGroups.has(topic))grammarGroups.set(topic,[]);
 grammarGroups.get(topic).push(row);
}
progressed=true;
while(progressed){
 progressed=false;
 for(const group of grammarGroups.values())if(group.length){
  if(choose(group.shift()))progressed=true;
 }
}
for(const row of wordCandidates)choose(row);
for(const row of lessonCandidates)choose(row);
for(const row of grammarCandidates)choose(row);
if(!selected.length)throw Error('No new Dutch content can be selected');
if(characters>budget)throw Error('Budget exceeded');
fs.mkdirSync(output,{recursive:true});
const manifest={
 version:1,language:'nl',approvedOnly:true,accountLabel:label,
 provenance:'Authored AI-edited Dutch lessons and verified vocabulary/word-game banks. No independent native-speaker certification.',
 plannedCharacters:characters,requestedBudget:budget,
 batches:[{id:'nl-credit-'+label,items:selected}]
};
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(output,'review.txt'),selected.map((row,i)=>(i+1)+'. ['+row.roles[0]+'] '+row.text).join('\n')+'\n');
console.log(JSON.stringify({
 language:'nl',accountLabel:label,requestedBudget:budget,selected:selected.length,characters,
 words:selected.filter(x=>!x.roles[0].startsWith('lesson-example')).length,
 lessonExamples:selected.filter(x=>x.roles[0].startsWith('lesson-example')).length,
 grammarCards:selected.filter(x=>x.roles[0].startsWith('grammar-card')).length,
 grammarEligible,grammarMissingAnalysis,
 skippedAlreadyInstalled:skippedIndexed,skippedAlreadyGenerated:skippedSaved,
 ignoredOutsideFullAudit:skippedOutsideAudit,
 manifest:path.relative(root,path.join(output,'manifest.json')),
 review:path.relative(root,path.join(output,'review.txt')),
 editorialStatus:'AI-edited sources only, no independent native review',
 paidRequestsMade:0
},null,2));