import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(root,"data/editorial/audio-workplace-500-review.json"),"utf8"));
if (data.rows.length !== 500) throw new Error("Expected 500 candidates");
const folder = path.join(root,"audio-export/workplace-500");
fs.mkdirSync(folder,{recursive:true});
for (let i=0;i<5;i++) {
  const rows=data.rows.slice(i*100,(i+1)*100);
  const csv=rows.map(r=>[r.cardId,r.dutch,r.english,r.approvedForRecording].join("\t"));
  fs.writeFileSync(path.join(folder,"review-"+(i+1)+".tsv"),"cardId\tDutch\tEnglish\tApproved\n"+csv.join("\n")+"\n");
}
console.log("Prepared five review groups of 100; no paid calls made.");
