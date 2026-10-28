import { describe, expect, it } from 'vitest';
import baseline from './fixtures/grammar-baseline.json';
import { applyAction, createSessionFromIds } from '@/lib/sessions/engine';
import { sessionSchema, type Session } from '@/lib/sessions/types';
import { cardFor } from '@/lib/content/cards';
import { EVERYDAY_CARDS } from '@/lib/flashcards/engine';
import { seededRandom } from '@/lib/sessions/wordOrder';
import { makeAction, NOW } from './helpers/sessions';

/**
 * A session saved before the Grammar Mastery work holds only ids that existed then. The session schema, reducer, store and
 * service are unchanged since that baseline (no diff in lib/sessions/types.ts, store.ts, service.ts, legacy.ts), so there is
 * nothing to migrate. This checks that such sessions still validate after a JSON round trip, still resolve every card to a
 * real sentence, and still take actions, for an Everyday session and for a session of the original grammar cards.
 */
const everydayIds = new Set(EVERYDAY_CARDS.map(c => c.id));
const oldEveryday = Object.keys(baseline.core).filter(id => everydayIds.has(id)).slice(0, 6);
const oldGrammar = Object.keys(baseline.legacyGrammar).filter(id => id.startsWith('pat-als-') || id.startsWith('pat-omdat-')).slice(0, 6);
const make = (collection: 'everyday' | 'grammar', cardIds: string[], topic: string): Session =>
  JSON.parse(JSON.stringify(createSessionFromIds({ id: `ses-00000001-${collection}`, name: 'Saved before the upgrade', cardIds, topic, collection, startingLevel: 'difficult', now: NOW, rand: seededRandom(collection) })));

describe('Sessions saved before the grammar expansion still work (P7)', () => {
  for (const [label, session] of [['an Everyday session', make('everyday', oldEveryday, 'all')], ['a session of the original grammar cards', make('grammar', oldGrammar, 'all')]] as const) {
    it(`${label}: validates, resolves every card and accepts actions`, () => {
      const parsed = sessionSchema.safeParse(session);
      expect(parsed.success ? 'ok' : JSON.stringify(parsed.error.issues.slice(0, 3))).toBe('ok');
      expect(session.cardIds).toHaveLength(6);
      for (const id of session.cardIds) expect(cardFor('nl', id), id).toBeDefined();
      const after = applyAction(sessionSchema.parse(session), makeAction({ type: 'study/next' }), NOW);
      expect(after.applied).toBe(true);
      expect(after.session.cardIds).toEqual(session.cardIds); // the fixed set never changes
    });
  }
  it('the original grammar cards keep their original ids, so their saved ratings and sessions still resolve', () => {
    expect(oldGrammar.length).toBeGreaterThan(0);
    for (const id of oldGrammar) expect(cardFor('nl', id)!.collection).toBe('grammar');
  });
});
