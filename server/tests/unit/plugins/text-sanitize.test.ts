/**
 * Emoji stripping at the render boundary — TREK renders plugin text with lucide icons,
 * not emojis, so all natively-rendered plugin contributions + notifications are stripped.
 */
import { describe, it, expect } from 'vitest';
import { stripEmoji, hasEmoji } from '../../../src/nest/plugins/text-sanitize';

describe('stripEmoji', () => {
  it('removes emojis and tidies the whitespace they leave behind', () => {
    expect(stripEmoji('🔥 Hot deal')).toBe('Hot deal');
    expect(stripEmoji('Price 💰 drop')).toBe('Price drop');       // collapses the double space
    expect(stripEmoji('🎉🎊✨')).toBe('');                          // all-emoji → empty
    expect(stripEmoji('Trip to Japan 🇯🇵')).toBe('Trip to Japan'); // flag (regional indicators)
    expect(stripEmoji('Done ✅️')).toBe('Done');                    // variation selector
    expect(stripEmoji('family 👨‍👩‍👧 outing')).toBe('family outing'); // ZWJ sequence, no stray glue
  });

  it('leaves plain text (incl. accents / CJK / punctuation) untouched', () => {
    expect(stripEmoji('Zürich – 3 nights')).toBe('Zürich – 3 nights');
    expect(stripEmoji('東京')).toBe('東京');
    expect(stripEmoji('A, B & C (1/2)')).toBe('A, B & C (1/2)');
  });

  it('keeps legitimate text symbols a plugin might render', () => {
    expect(stripEmoji('★★★☆☆')).toBe('★★★☆☆');            // rating stars
    expect(stripEmoji('© 2026 Acme')).toBe('© 2026 Acme'); // copyright
    expect(stripEmoji('Acme®')).toBe('Acme®');
    expect(stripEmoji('Product™ GmbH')).toBe('Product™ GmbH');
  });

  it('strips a skin-tone modifier so no orphan swatch is left behind', () => {
    expect(stripEmoji('👋🏻 hi')).toBe('hi');
  });

  it('keeps newlines/paragraphs — verbatim when nothing is stripped, and when it strips', () => {
    expect(stripEmoji('Para1\n\nPara2')).toBe('Para1\n\nPara2'); // untouched
    expect(stripEmoji('A 🔥\n\nB')).toBe('A\n\nB');              // only the horizontal gap closes
  });

  it('hasEmoji detects at least one emoji', () => {
    expect(hasEmoji('plain')).toBe(false);
    expect(hasEmoji('has 🚀')).toBe(true);
  });
});
