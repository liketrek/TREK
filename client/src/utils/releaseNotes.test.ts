// FE-UTIL-RELNOTES-001 to -005: the release body parser both admin shells render from.
import { escapeReleaseHtml, parseReleaseNotes } from './releaseNotes';

describe('parseReleaseNotes', () => {
  it('FE-UTIL-RELNOTES-001: reads headings, paragraphs and list items', () => {
    expect(parseReleaseNotes('## Release\n### Fixed\nSome text\n- one\n* two')).toEqual([
      { kind: 'h3', text: 'Release' },
      { kind: 'h4', text: 'Fixed' },
      { kind: 'p', text: 'Some text' },
      { kind: 'ul', items: ['one', 'two'] },
    ]);
  });

  it('FE-UTIL-RELNOTES-002: a blank line or any other block ends a list', () => {
    expect(parseReleaseNotes('- a\n\n- b\nplain\n- c\n### H\n- d')).toEqual([
      { kind: 'ul', items: ['a'] },
      { kind: 'ul', items: ['b'] },
      { kind: 'p', text: 'plain' },
      { kind: 'ul', items: ['c'] },
      { kind: 'h4', text: 'H' },
      { kind: 'ul', items: ['d'] },
    ]);
  });

  it('FE-UTIL-RELNOTES-003: lines are trimmed and markers need their space', () => {
    expect(parseReleaseNotes('   ## Spaced  \n-no space\n#### deep\n\n\n')).toEqual([
      { kind: 'h3', text: 'Spaced' },
      { kind: 'p', text: '-no space' },
      { kind: 'p', text: '#### deep' },
    ]);
  });

  it('FE-UTIL-RELNOTES-004: an empty body has no blocks', () => {
    expect(parseReleaseNotes('')).toEqual([]);
  });
});

describe('escapeReleaseHtml', () => {
  it('FE-UTIL-RELNOTES-005: escapes ampersands, angle brackets and double quotes only', () => {
    expect(escapeReleaseHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry's&lt;/a&gt;"
    );
  });
});
