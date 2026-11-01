/** Resolve DutchTap audio paths to Cloudflare R2 when configured.
 *
 * Exact-text utterances live in R2 when NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL is set.
 * The 600 original flashcard recordings need a separate, opt-in cutover:
 * NEXT_PUBLIC_DUTCH_AUDIO_LEGACY_R2=true only AFTER their R2 upload verifies.
 * No credentials are used here. French and other asset URLs stay local.
 */
export function resolveRecordingUrl(
  path: string,
  baseUrl: string | undefined = process.env.NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL,
  legacyEnabled: boolean = process.env.NEXT_PUBLIC_DUTCH_AUDIO_LEGACY_R2 === 'true',
): string {
  const utterance = /^\/audio\/utterances\/([a-f0-9]{24}\.mp3)$/.exec(path);
  const legacy = legacyEnabled
    ? /^\/audio\/flashcards\/([a-z0-9][a-z0-9-]*\.mp3)$/.exec(path)
    : null;
  if ((!utterance && !legacy) || !baseUrl?.trim()) return path;
  const base = baseUrl.trim().replace(/\/+$/, '');
  const url = new URL(base);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL must be an HTTPS origin with no path, query, or credentials');
  }
  return `${url.origin}/${utterance ? 'utterances/' + utterance[1] : 'flashcards/' + legacy![1]}`;
}
