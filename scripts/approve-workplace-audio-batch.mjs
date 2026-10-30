// Explicit editorial approval, NOT recording generation.
import fs from "node:fs";
const filename = "data/editorial/audio-workplace-500-review.json";
const batch = Number(process.argv[2]);
if (!Number.isInteger(batch) || batch < 1 || batch > 5 || process.argv[3] !== "--reviewed")
  throw Error("Usage: node scripts/approve-workplace-audio-batch.mjs 1 --reviewed (after reviewing that batch)");
const data = JSON.parse(fs.readFileSync(filename,"utf8"));
if (data.rows.length !== 500) throw Error("Unexpected campaign size");
for (const row of data.rows.slice((batch-1)*100,batch*100)) {
  row.approvedForRecording = true;
  row.reviewNote = "Approved for audio generation, not independently native-certified.";
}
data.approvedCount = data.rows.filter(r=>r.approvedForRecording).length;
fs.writeFileSync(filename, JSON.stringify(data,null,2)+"\n");
console.log("Approved",data.approvedCount,"of 500. No audio generated or credits used.");
