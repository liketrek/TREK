/**
 * stripHtmlTags replaced `/<[^>]+>/g` on two attacker-reachable paths (an
 * uploaded KML description, Wikimedia Commons metadata), where that pattern
 * backtracks: `[^>]` matches `<` as well, so a run of `<` with no closing
 * bracket is retried from every one of them.
 *
 * The contract is "identical output to the regex, including its quirks", so the
 * cases below are written against the regex rather than against what a tidy tag
 * stripper would do.
 */
import { describe, it, expect } from 'vitest';
import { stripHtmlTags } from '../../../src/nest/common/stripHtmlTags';

/** The pattern this function replaced — the oracle for every case here. */
const oracle = (s: string, repl = '') => s.replace(/<[^>]+>/g, repl);

describe('stripHtmlTags', () => {
  it('STRIP-001: removes ordinary tags and keeps the text between them', () => {
    expect(stripHtmlTags('<b>bold</b> and <i>it</i>')).toBe('bold and it');
  });

  it('STRIP-002: substitutes the replacement string when one is given', () => {
    expect(stripHtmlTags('<a href="x">link</a>', ' ')).toBe(' link ');
  });

  it('STRIP-003: leaves text with no tags untouched', () => {
    expect(stripHtmlTags('plain text, 3 < 4 and nothing else')).toBe('plain text, 3 < 4 and nothing else');
  });

  it('STRIP-004: leaves `<>` alone, because the pattern needs a character between the brackets', () => {
    expect(stripHtmlTags('a<>b')).toBe('a<>b');
    expect(stripHtmlTags('a<>b')).toBe(oracle('a<>b'));
  });

  it('STRIP-005: treats `<` inside a tag as content, the way a browser does', () => {
    // Narrowing the class to [^<>] would make this two tags and leave "<a" behind.
    expect(stripHtmlTags('<a<b>x')).toBe('x');
    expect(stripHtmlTags('<a<b>x')).toBe(oracle('<a<b>x'));
  });

  it('STRIP-006: keeps an unterminated `<` as literal text', () => {
    expect(stripHtmlTags('text <not closed')).toBe('text <not closed');
  });

  it('STRIP-007: spans newlines inside a tag', () => {
    expect(stripHtmlTags('<div\n class="x">y</div>')).toBe('y');
  });

  it('STRIP-008: matches the regex on every string over `<>ab \\n` up to length 6', () => {
    const alphabet = ['<', '>', 'a', 'b', ' ', '\n'];
    let compared = 0;
    const walk = (prefix: string, depth: number) => {
      for (const repl of ['', ' ']) {
        expect(stripHtmlTags(prefix, repl), JSON.stringify(prefix)).toBe(oracle(prefix, repl));
        compared++;
      }
      if (depth === 0) return;
      for (const c of alphabet) walk(prefix + c, depth - 1);
    };
    walk('', 6);
    expect(compared).toBeGreaterThan(100_000);
  });

  it('STRIP-009: stays linear on the input the regex went quadratic on', () => {
    // 40k '<' with no '>': the regex restarted at every one and rescanned to the
    // end, ~0.9s. A generous bound — the point is the shape, not the machine.
    const evil = '<'.repeat(40_000);
    const started = Date.now();
    expect(stripHtmlTags(evil)).toBe(evil);
    expect(Date.now() - started).toBeLessThan(500);
  });
});
