import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GRAMMAR_AREAS } from '@/lib/content/collections';
import { PatternTiles } from '@/components/sessions/PatternTiles';

describe('Grammar pattern tiles', () => {
  const html = renderToStaticMarkup(createElement(PatternTiles));
  it('keeps one direct link per pattern, each exactly once', () => {
    for (const id of Object.keys(GRAMMAR_AREAS)) {
      const hits = html.split(`href="/flashcards?new=grammar:${id}"`).length - 1;
      expect(hits, id).toBe(1);
    }
  });
  it('groups related patterns under readable headings and leaves none ungrouped', () => {
    for (const title of ['Word order &amp; verbs', 'Reasons &amp; statements', 'Time', 'Contrast &amp; exceptions']) expect(html, title).toContain(title);
    expect(html).not.toContain('More patterns');
  });
});
