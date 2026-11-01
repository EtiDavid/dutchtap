// Read account credit balance from ElevenLabs without printing the API key.
// Requires ELEVENLABS_API_KEY in .env/.env.local; GET only, does not spend credits.
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const name of ['.env','.env.local']){
 try{loadEnvFile(path.join(root,name));}
 catch(e){if(e.code!=='ENOENT')throw e}
}
const key=process.env.ELEVENLABS_API_KEY;
if(!key)throw Error('ELEVENLABS_API_KEY missing in local .env or .env.local');
const response=await fetch('https://api.elevenlabs.io/v1/user/subscription',{
 headers:{'xi-api-key':key,'Accept':'application/json'},
 signal:AbortSignal.timeout(15000)
});
if(!response.ok)throw Error('ElevenLabs subscription GET failed (HTTP '+response.status+')');
const data=await response.json();
const used=Number(data.character_count), limit=Number(data.character_limit);
if(!Number.isFinite(used)||!Number.isFinite(limit))throw Error('Cannot read subscription credit counters; inspect account dashboard');
const remaining=Math.max(0,limit-used);
console.log(JSON.stringify({
 subscriptionTier:data.tier,subscriptionStatus:data.status,
 used,limit,estimatedRemaining:remaining,
 recommendedSafeNextBudget:Math.min(28000,Math.max(0,remaining-500)),
 note:'Subscription API counters are an estimate. Check dashboard before paid generation; this GET spends no credits. Overages and non-TTS usage may affect billing.'
},null,2));