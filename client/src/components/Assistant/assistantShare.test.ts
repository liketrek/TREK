/**
 * FE-AI-SHARE-001 to FE-AI-SHARE-005
 *
 * What an answer says once it goes to the trip chat: Markdown read as plain
 * text, the applied changes on request and only those, and a cut at a word
 * end that says so.
 */
import type { AssistantChangePreview, AssistantMessage, AssistantMessagePart } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { chatTextOf, markdownToText, SHARE_MAX_CHARS } from './assistantShare';

const t = (key: string) => (key === 'assistant.share.changesHeading' ? 'Applied:' : `<${key}>`);

function message(parts: AssistantMessagePart[]): AssistantMessage {
  return { id: 'msg-3', role: 'assistant', status: 'complete', createdAt: '2026-10-21T08:00:00.000Z', parts };
}

function change(id: string, subject: string, approval: { approved?: boolean }): AssistantMessagePart[] {
  const preview: AssistantChangePreview = {
    toolCallId: id,
    verbKey: 'addPlace',
    subject,
    rows: [],
    dayId: 3,
    placeIds: [],
    undoable: true,
  };
  return [
    { type: 'tool-call', toolCallId: id, toolName: 'create_place', args: {}, approval: { id, ...approval } },
    { type: 'data-trek-change', data: preview },
  ];
}

describe('markdownToText', () => {
  it('FE-AI-SHARE-001: reads headings, emphasis, code, lists, links, quotes and tables as plain text', () => {
    const text = markdownToText(
      [
        '## Day 3',
        '',
        'Go **early** to *Fushimi Inari*, take `JR Nara`.',
        '- [Tickets](https://example.com/t)',
        '* https://example.com',
        '> Bring water',
        '',
        '| Stop | Time |',
        '|---|:--:|',
        '| Shrine | 08:00 |',
        '```',
        '**kept**',
        '```',
        '',
        '',
        '',
        'Done.',
      ].join('\n')
    );
    expect(text).toBe(
      [
        'Day 3',
        '',
        'Go early to Fushimi Inari, take JR Nara.',
        '• Tickets (https://example.com/t)',
        '• https://example.com',
        'Bring water',
        '',
        'Stop, Time',
        'Shrine, 08:00',
        '**kept**',
        '',
        'Done.',
      ].join('\n')
    );
  });

  it('FE-AI-SHARE-002: a link whose text is its address stays one address', () => {
    expect(markdownToText('[https://trek.app](https://trek.app)')).toBe('https://trek.app');
  });

  it('FE-AI-SHARE-006: pictures, odd links and divider rows read as before', () => {
    expect(markdownToText('![Map](a.png) and [[nested]](u) and [a b](x y) and [](z) and [ok](u)')).toBe(
      'Map and [[nested]](u) and [a b](x y) and [](z) and ok (u)'
    );
    expect(markdownToText('|:-|-:|\n| a | b |')).toBe('a, b');
    expect(markdownToText('| - | x |')).toBe('-, x');
    expect(markdownToText('#   Wide heading\n-    wide item')).toBe('Wide heading\n• wide item');
  });

  it('FE-AI-SHARE-007: long runs of brackets, spaces and dashes are read in one pass', () => {
    const started = Date.now();
    const long = 20000;
    markdownToText(`${'['.repeat(long)}\n${'![a](b '.repeat(long / 7)}\n${'-'.repeat(long)}\n#${' '.repeat(long)}x`);
    markdownToText(`|${' - |'.repeat(long / 4)} x`);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('chatTextOf', () => {
  it('FE-AI-SHARE-003: adds only the applied changes, under a heading, when asked to', () => {
    const msg = message([
      { type: 'text', text: 'I added **two** places.' },
      ...change('c1', 'Kinkaku-ji', { approved: true }),
      { type: 'data-trek-applied', data: { toolCallId: 'c1', entity: 'place', ids: [9], dayId: 3, undoUntil: null } },
      ...change('c2', 'Ryoan-ji', { approved: false }),
      ...change('c3', 'Ginkaku-ji', {}),
    ]);
    expect(chatTextOf(msg, { includeChanges: true, t })).toEqual({
      text: 'I added two places.\n\nApplied:\n✓ <assistant.change.verb.addPlace>: Kinkaku-ji',
      truncated: false,
      hasChanges: true,
    });
    expect(chatTextOf(msg, { includeChanges: false, t })).toEqual({
      text: 'I added two places.',
      truncated: false,
      hasChanges: true,
    });
  });

  it('FE-AI-SHARE-004: an answer without text or applied changes has nothing to share', () => {
    expect(chatTextOf(message(change('c1', 'Kinkaku-ji', {})), { includeChanges: true, t })).toEqual({
      text: '',
      truncated: false,
      hasChanges: false,
    });
  });

  it('FE-AI-SHARE-005: a long answer is cut at a word end within the limit and marked', () => {
    const words = Array.from({ length: 1200 }, (_, i) => `word${i}`).join(' ');
    const { text, truncated } = chatTextOf(message([{ type: 'text', text: words }]), { includeChanges: false, t });
    expect(truncated).toBe(true);
    expect(text.length).toBeLessThanOrEqual(SHARE_MAX_CHARS);
    expect(text.endsWith('…')).toBe(true);
    expect(words.startsWith(text.slice(0, -1))).toBe(true);
    expect(words.charAt(text.length - 1)).toBe(' ');
  });
});
