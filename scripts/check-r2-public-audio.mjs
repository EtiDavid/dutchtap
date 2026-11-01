// Public, no-credential smoke test for an R2 MP3 before enabling DutchTap's CDN routing.
// Usage: node scripts/check-r2-public-audio.mjs https://pub-xxxx.r2.dev [24-hex-audio-id]
// This does not use R2 S3 credentials and does not modify files or deployments.
const base = process.argv[2];
const id = process.argv[3] || '0003d9bb40d98b32b6931297';
if (!base) throw Error('Usage: node scripts/check-r2-public-audio.mjs https://PUBLIC-R2-ORIGIN [24-hex-id]');
if (!/^[a-f0-9]{24}$/.test(id)) throw Error('Expected a 24-character recording ID.');
const u = new URL(base);
if (u.protocol !== 'https:' || u.pathname !== '/' || u.search || u.hash || u.username || u.password)
  throw Error('Provide only the HTTPS public R2 origin; no object path, credentials, or query.');
const url = new URL('/utterances/' + id + '.mp3', u);
const abort = AbortSignal.timeout(15000);
const response = await fetch(url, { headers: { Range: 'bytes=0-511' }, signal: abort });
const data = new Uint8Array(await response.arrayBuffer());
const type = response.headers.get('content-type') || '(not provided)';
const isMp3 = data.length > 2 && (
  (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) ||
  (data[0] === 0xff && (data[1] & 0xe0) === 0xe0)
);
console.log(JSON.stringify({
  url: url.href, status: response.status, contentType: type,
  bytesReceived: data.length, mp3HeaderDetected: isMp3,
}, null, 2));
if (!response.ok || !data.length || !isMp3)
  throw Error('Public R2 playback smoke test failed. Check Public Development URL, object key, and permissions.');
if (!type.toLowerCase().includes('audio/'))
  console.warn('WARNING: object Content-Type is not audio/*. Browser playback may be inconsistent. Set audio/mpeg for MP3 uploads.');
console.log('Public R2 MP3 is reachable and has an MP3 header. Test play/pause in a real browser next.');
