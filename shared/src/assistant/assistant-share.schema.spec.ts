import { assistantShareRequestSchema } from './assistant-share.schema';

import { describe, expect, it } from 'vitest';

describe('assistantShareRequestSchema', () => {
  it('takes one to 5000 characters and trims them', () => {
    expect(assistantShareRequestSchema.parse({ text: '  Day 2 is set.  ' })).toEqual({ text: 'Day 2 is set.' });
    expect(assistantShareRequestSchema.safeParse({ text: 'x' }).success).toBe(true);
    expect(assistantShareRequestSchema.safeParse({ text: 'x'.repeat(5000) }).success).toBe(true);
  });

  it('refuses empty or blank text and text past the chat limit', () => {
    expect(assistantShareRequestSchema.safeParse({ text: '' }).success).toBe(false);
    expect(assistantShareRequestSchema.safeParse({ text: ' \n\t ' }).success).toBe(false);
    expect(assistantShareRequestSchema.safeParse({ text: 'x'.repeat(5001) }).success).toBe(false);
    expect(assistantShareRequestSchema.safeParse({}).success).toBe(false);
  });

  it('takes nothing but the text, so the origin is never the client to set', () => {
    expect(assistantShareRequestSchema.safeParse({ text: 'hi', origin: 'assistant' }).success).toBe(false);
  });
});
