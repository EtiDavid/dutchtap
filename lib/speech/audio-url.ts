/** Resolve DutchTap's exact-text Dutch recordings to Cloudflare R2 when configured.
 * The saved audio index remains location-agnostic; legacy flashcard recordings stay local.
 * Set NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL to an HTTPS public bucket URL, without /utterances.
 */
export function resolveRecordingUrl(
  path: string,
  baseUrl: string | undefined = process.env.NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL,
): string {
  const match = /^\/audio\/utterances\/([a-f0-9]{24}\.mp3)$/.exec(path);
  if (!match || !baseUrl?.trim()) return path;
  const base = baseUrl.trim().replace(/\/+$/, "");
  const url = new URL(base);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_DUTCH_AUDIO_BASE_URL must be an HTTPS origin with no path, query, or credentials");
  }
  return `${url.origin}/utterances/${match[1]}`;
}
