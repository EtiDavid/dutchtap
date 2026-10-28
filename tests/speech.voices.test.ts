import { describe, expect, it } from 'vitest';
import { isVoiceFor, pickVoice, voicesFor } from '@/lib/speech/voices';

const v = (name: string, lang: string) => ({ name, lang });
const installed = [v('Amélie', 'fr-BE'), v('Google US English', 'en-US'), v('Xander', 'nl-NL'), v('Ellen', 'nl-BE'), v('Claire', 'nl'), v('Thomas', 'fr-FR'), v('Android Dutch', 'nl_NL')];

describe('Dutch device voice selection (P6)', () => {
  it('only ever offers voices of the language itself: no French, English or other voice speaks Dutch', () => {
    const dutch = voicesFor('nl', installed);
    expect(dutch.map(x => x.name).sort()).toEqual(['Android Dutch', 'Claire', 'Ellen', 'Xander']);
    for (const voice of installed.filter(x => !/^nl/.test(x.lang))) expect(isVoiceFor('nl', voice)).toBe(false);
  });
  it('prefers Belgian Dutch (nl-BE), then nl-NL, then any other Dutch voice', () => {
    // nl_NL and nl-NL are the same tag (equal rank, then by name); the bare 'nl' voice comes last
    expect(voicesFor('nl', installed).map(x => x.name)).toEqual(['Ellen', 'Android Dutch', 'Xander', 'Claire']);
    expect(pickVoice('nl', installed)?.name).toBe('Ellen');
    expect(pickVoice('nl', installed.filter(x => x.name !== 'Ellen'))?.lang).toMatch(/^nl[-_]NL$/);
  });
  it('keeps the learner\'s saved choice while that voice is still installed, otherwise falls back to the best one', () => {
    expect(pickVoice('nl', installed, 'Xander')?.name).toBe('Xander');
    expect(pickVoice('nl', installed, 'Removed voice')?.name).toBe('Ellen');
  });
  it('returns no voice, rather than a wrong-language one, when no Dutch voice exists', () => {
    expect(pickVoice('nl', [v('Amélie', 'fr-BE'), v('Google US English', 'en-US')])).toBeNull();
    expect(voicesFor('nl', [])).toEqual([]);
  });
  it('does not treat a longer tag that merely starts with the letters nl as Dutch', () => {
    expect(isVoiceFor('nl', v('x', 'nlx-XX'))).toBe(false);
    expect(isVoiceFor('nl', v('x', 'NL-be'))).toBe(true);
  });
});
