import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2);
const at=args.indexOf('--manifest');
if(at<0||!args[at+1])throw Error('Provide --manifest path');
const filepath=path.resolve(args[at+1]);
const input=JSON.parse(fs.readFileSync(filepath,'utf8'));
if(input.language!=='nl')throw Error('Dutch audio only');
const rows=input.batches.flatMap(b=>b.items);
const review=fs.readFileSync(path.join(path.dirname(filepath),'review.tsv'),'utf8').trimEnd().split('\n');
if(review.shift()!=='status\tid\ttext\troles')throw Error('Invalid review header');
if(rows.length!==review.length)throw Error('Unexpected row count');
let approved=[],pending=0,rejected=0;
for(let i=0;i<rows.length;i++){
 const [status,id,text,roles]=review[i].replace(/\r$/,'').split('\t');
 const original=rows[i];
 if(id!==original.id||text!==original.text||roles!==original.roles.join(',')||original.lang!=='nl')throw Error('Review/manifest mismatch on row '+i);
 if(createHash('sha256').update('nl\\0'+text).digest('hex').slice(0,24)!==id)throw Error('ID mismatch on row '+i);
 if(status==='APPROVED')approved.push({...original,approved:true});
 else if(status==='PENDING')pending++;
 else if(status==='REJECT')rejected++;
 else throw Error('Invalid review status on row '+i);
}
text(JSON.stringify({approved:approved.length,pending,rejected,approvedCharacters:approved.reduce((n,x)=>n+x.text.length,0)}));
if(!args.includes('--apply'))process.exit(0);
if(approved.length===0)throw Error('No approved rows');
const output={...input,approvedOnly:true,batches:[{...input.batches[0],items:approved}]};
fs.writeFileSync(path.join(path.dirname(filepath),'approved-manifest.json'),JSON.stringify(output,null,2)+'\n');
