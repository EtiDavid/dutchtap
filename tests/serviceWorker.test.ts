import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Loads public/sw.js into a sandbox with a fake CacheStorage so its real routing code can be exercised. */
type Handler = (event: unknown) => void;
class FakeCache {
  entries = new Map<string, Response>();
  private key = (request: Request | string) => (typeof request === 'string' ? new URL(request, 'https://app.test').href : request.url);
  async match(request: Request | string, options?: { ignoreSearch?: boolean }) {
    const wanted = new URL(this.key(request));
    for (const [url, response] of this.entries) {
      const stored = new URL(url);
      if (options?.ignoreSearch ? stored.origin + stored.pathname === wanted.origin + wanted.pathname : url === wanted.href) return response.clone();
    }
    return undefined;
  }
  async put(request: Request | string, response: Response) { this.entries.set(this.key(request), response); }
  async add(request: Request | string) { const response = await sandboxFetch(new Request(this.key(request))); this.entries.set(this.key(request), response); }
}
class FakeCaches {
  stores = new Map<string, FakeCache>();
  async open(name: string) { if (!this.stores.has(name)) this.stores.set(name, new FakeCache()); return this.stores.get(name)!; }
  async keys() { return [...this.stores.keys()]; }
  async delete(name: string) { return this.stores.delete(name); }
}
let sandboxFetch: (request: Request) => Promise<Response>;

function load() {
  const handlers = new Map<string, Handler>();
  const caches = new FakeCaches();
  let skipped = false; let claimed = false;
  const context = {
    self: { location: { origin: 'https://app.test' }, addEventListener: (type: string, handler: Handler) => handlers.set(type, handler), skipWaiting: () => { skipped = true; }, clients: { claim: async () => { claimed = true; } } },
    caches, fetch: (request: Request) => sandboxFetch(request), URL, Request, Response, Promise, setTimeout, console,
  };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), context);
  const fire = async (type: string, request?: Request) => {
    let answer: Promise<Response> | undefined; const waits: Promise<unknown>[] = [];
    handlers.get(type)!({ request, respondWith: (p: Promise<Response>) => { answer = p; }, waitUntil: (p: Promise<unknown>) => { waits.push(p); } });
    await Promise.all(waits);
    return answer;
  };
  return { caches, fire, state: () => ({ skipped, claimed }) };
}
const nav = (path: string) => { const request = new Request(`https://app.test${path}`); Object.defineProperty(request, 'mode', { value: 'navigate' }); return request; };
const html = (text: string) => new Response(text, { headers: { 'Content-Type': 'text/html' } });

beforeEach(() => { vi.useRealTimers(); });

describe('service worker', () => {
  it('installs by saving the main pages, takes over immediately, and removes every older DutchTap cache', async () => {
    sandboxFetch = async request => html(`page ${new URL(request.url).pathname}`);
    const sw = load();
    await sw.fire('install');
    expect([...(await sw.caches.open('dutchtap-pages-v3')).entries.keys()].map(u => { const url = new URL(u); return url.pathname + url.search; }).sort()).toEqual(['/', '/flashcards', '/flashcards?lang=fr', '/manifest.webmanifest', '/quiz', '/quiz?lang=fr', '/vocabulary', '/vocabulary?lang=fr']);
    expect(sw.state().skipped).toBe(true);
    for (const old of ['dutchtap-v1', 'dutchtap-v2', 'dutchtap-pages-v2', 'unrelated-cache']) await sw.caches.open(old);
    await sw.fire('activate');
    expect(await sw.caches.keys()).toEqual(expect.arrayContaining(['dutchtap-pages-v3']));
    expect(await sw.caches.keys()).not.toEqual(expect.arrayContaining(['dutchtap-v1', 'dutchtap-v2', 'dutchtap-pages-v2']));
    expect(await sw.caches.keys()).toContain('unrelated-cache'); // other apps' caches are left alone
    expect(sw.state().claimed).toBe(true);
  });

  it('a new deployment reaches a returning user: pages are network first, so a saved old page is NOT served while online', async () => {
    const sw = load();
    sandboxFetch = async () => html('OLD session screen');
    await sw.fire('install');
    expect(await (await sw.fire('fetch', nav('/flashcards')))!.text()).toBe('OLD session screen');
    sandboxFetch = async () => html('NEW session screen after deployment');
    expect(await (await sw.fire('fetch', nav('/flashcards')))!.text()).toBe('NEW session screen after deployment');
    sandboxFetch = async () => { throw new TypeError('offline'); };
    expect(await (await sw.fire('fetch', nav('/flashcards')))!.text()).toBe('NEW session screen after deployment'); // the newest copy is what offline users get
  });

  it('works offline for pages visited before, including a session URL (it falls back to the saved dashboard)', async () => {
    const sw = load();
    sandboxFetch = async () => html('dashboard');
    await sw.fire('install');
    sandboxFetch = async () => { throw new TypeError('offline'); };
    expect(await (await sw.fire('fetch', nav('/flashcards?session=abc&mode=quiz')))!.text()).toBe('dashboard');
    expect(await (await sw.fire('fetch', nav('/vocabulary')))!.text()).toBe('dashboard'); // saved copy of /vocabulary is the same stub here
  });

  it('never answers a data (RSC) request with a saved HTML page, and says so plainly when nothing is saved', async () => {
    const sw = load();
    sandboxFetch = async () => { throw new TypeError('offline'); };
    const rsc = new Request('https://app.test/flashcards?_rsc=abc', { headers: { RSC: '1' } });
    const miss = await sw.fire('fetch', rsc);
    expect(miss!.status).toBe(503);
    const unsaved = await sw.fire('fetch', nav('/sentences/shopping-01'));
    expect(unsaved!.status).toBe(503);
    expect(await unsaved!.text()).toMatch(/offline/);
  });

  it('keeps waiting for a slow network when nothing is saved, instead of failing early', async () => {
    const sw = load();
    sandboxFetch = () => new Promise(resolve => setTimeout(() => resolve(html('slow but fine')), 30));
    expect(await (await sw.fire('fetch', nav('/never-seen')))!.text()).toBe('slow but fine');
  });

  it('falls back to the saved copy when the network is too slow, and refreshes it for next time', async () => {
    const sw = load();
    sandboxFetch = async () => html('saved copy');
    await sw.fire('fetch', nav('/flashcards'));
    vi.useFakeTimers();
    sandboxFetch = () => new Promise(resolve => setTimeout(() => resolve(html('late fresh copy')), 60_000));
    const pending = sw.fire('fetch', nav('/flashcards'));
    await vi.advanceTimersByTimeAsync(4100);
    expect(await (await pending)!.text()).toBe('saved copy');
    await vi.advanceTimersByTimeAsync(60_000);
    vi.useRealTimers();
    sandboxFetch = async () => { throw new TypeError('offline'); };
    expect(await (await sw.fire('fetch', nav('/flashcards')))!.text()).toBe('late fresh copy');
  });

  it('serves hashed build files cache first, and pictures/audio stale-while-revalidate', async () => {
    const sw = load();
    let calls = 0;
    sandboxFetch = async () => { calls++; return new Response(`file v${calls}`); };
    const js = new Request('https://app.test/_next/static/chunks/app-abc123.js');
    expect(await (await sw.fire('fetch', js))!.text()).toBe('file v1');
    expect(await (await sw.fire('fetch', js))!.text()).toBe('file v1');
    expect(calls).toBe(1); // second time: no network at all
    const image = new Request('https://app.test/illustrations/cards/shopping-01.webp');
    expect(await (await sw.fire('fetch', image))!.text()).toBe('file v2');
    expect(await (await sw.fire('fetch', image))!.text()).toBe('file v2'); // instant, from the cache...
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(calls).toBe(3); // ...while it refreshes in the background
    expect(await (await sw.fire('fetch', image))!.text()).toBe('file v3');
  });

  it('leaves the API, non-GET requests, other origins, the worker file and audio Range requests alone', async () => {
    const sw = load();
    sandboxFetch = async () => html('x');
    for (const request of [
      new Request('https://app.test/api/learning-sessions'), new Request('https://app.test/api/flashcards', { method: 'POST', body: '{}' }),
      new Request('https://cdn.example/lib.js'), new Request('https://app.test/sw.js'),
      new Request('https://app.test/audio/flashcards/shopping-01.mp3', { headers: { Range: 'bytes=0-' } }),
    ]) expect(await sw.fire('fetch', request)).toBeUndefined();
  });

  it('does not cache failed responses', async () => {
    const sw = load();
    sandboxFetch = async () => new Response('boom', { status: 500 });
    expect((await sw.fire('fetch', nav('/flashcards')))!.status).toBe(500);
    sandboxFetch = async () => { throw new TypeError('offline'); };
    expect((await sw.fire('fetch', nav('/flashcards')))!.status).toBe(503);
  });

  it('keeps French and Dutch addresses apart: each is cached under its own URL and answered from its own entry', async () => {
    sandboxFetch = async request => html(`page ${new URL(request.url).pathname}${new URL(request.url).search}`);
    const sw = load();
    await sw.fire('install');
    const online = await sw.fire('fetch', nav('/flashcards?lang=fr'));
    expect(await online!.text()).toBe('page /flashcards?lang=fr');
    const dutch = await sw.fire('fetch', nav('/flashcards'));
    expect(await dutch!.text()).toBe('page /flashcards');
    sandboxFetch = async () => { throw new Error('offline'); };
    const frenchOffline = await sw.fire('fetch', nav('/flashcards?lang=fr'));
    expect(await frenchOffline!.text()).toBe('page /flashcards?lang=fr');
    const dutchOffline = await sw.fire('fetch', nav('/flashcards'));
    expect(await dutchOffline!.text()).toBe('page /flashcards');
  });
});
