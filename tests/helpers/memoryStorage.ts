import type { StorageLike } from '@/lib/sessions/store';

/** localStorage stand-in. `broken` simulates private windows / blocked storage. */
export class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  broken = false;
  getItem(key: string) { if (this.broken) throw new Error('storage blocked'); return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.broken) throw new Error('storage blocked'); this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}
