import {
  CLOUD_TEXT_WINDOW,
  fitTextWindow,
  LOCAL_FLIGHT_TEXT_WINDOW,
  LOCAL_TEXT_WINDOW,
} from '../../../../src/nest/llm-parse/text-window';

import { describe, it, expect } from 'vitest';

describe('fitTextWindow', () => {
  it('leaves a text that fits as it is', () => {
    expect(fitTextWindow('short', 10)).toEqual({ text: 'short', omitted: 0 });
    expect(fitTextWindow('x'.repeat(10), 10)).toEqual({ text: 'x'.repeat(10), omitted: 0 });
  });

  it('keeps three quarters from the start and a quarter from the end around a marker', () => {
    const text = 'a'.repeat(5000) + 'b'.repeat(5000);
    const { text: out, omitted } = fitTextWindow(text, 4000);
    expect(omitted).toBe(6000);
    expect(out).toBe(`${'a'.repeat(3000)}\n[... 6000 characters omitted ...]\n${'b'.repeat(1000)}`);
  });

  it('cuts on a nearby line break, so a line at either cut stays whole', () => {
    const lines = Array.from({ length: 400 }, (_, i) => `Line ${String(i).padStart(3, '0')}: Total paid USD 200.00`);
    const text = lines.join('\n');
    const { text: out, omitted } = fitTextWindow(text, 4000);
    const [head, tail] = out.split(/\n\[\.\.\. \d+ characters omitted \.\.\.\]\n/);
    for (const part of [head, tail]) for (const line of part.split('\n')) expect(lines).toContain(line);
    expect(head.length + tail.length).toBeLessThanOrEqual(4000);
    expect(head.length + tail.length + omitted).toBe(text.length);
    expect(tail.endsWith(lines[lines.length - 1])).toBe(true);
  });

  it('cuts inside a line when no line break is close', () => {
    const text = `${'a'.repeat(2000)}\n${'b'.repeat(8000)}`;
    const { text: out } = fitTextWindow(text, 4000);
    expect(out.startsWith(`${'a'.repeat(2000)}\n${'b'.repeat(999)}\n[...`)).toBe(true);
  });

  it('gives a cloud model a far wider window than a local one, and keeps the local ones', () => {
    expect(CLOUD_TEXT_WINDOW).toBe(24_000);
    expect(LOCAL_FLIGHT_TEXT_WINDOW).toBe(16_000);
    expect(LOCAL_TEXT_WINDOW).toBe(6_000);
  });
});
