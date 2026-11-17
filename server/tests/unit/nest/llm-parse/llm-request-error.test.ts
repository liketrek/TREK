import {
  errorBodyCode,
  llmRequestError,
  LlmRequestError,
} from '../../../../src/nest/llm-parse/clients/llm-request-error';

import { describe, expect, it } from 'vitest';

describe('llm-request-error', () => {
  it('LLM-REQERR-001: reads the code at the top, as the TREK Cloud gate sends it', () => {
    const body = JSON.stringify({ error: 'The document analyses for this period are used up.', code: 'QUOTA_SPENT' });
    expect(errorBodyCode(body)).toBe('QUOTA_SPENT');
  });

  it('LLM-REQERR-002: reads the code inside error, as OpenAI and Anthropic send it', () => {
    expect(errorBodyCode(JSON.stringify({ error: { type: 'rate_limit_error', code: 'rate_limited' } }))).toBe(
      'rate_limited',
    );
    expect(errorBodyCode(JSON.stringify({ error: { message: 'no code here' } }))).toBeUndefined();
  });

  it('LLM-REQERR-003: a body that is not JSON, not an object, empty or oversized names no code', () => {
    expect(errorBodyCode('upstream down')).toBeUndefined();
    expect(errorBodyCode('"QUOTA_SPENT"')).toBeUndefined();
    expect(errorBodyCode('null')).toBeUndefined();
    expect(errorBodyCode('')).toBeUndefined();
    expect(errorBodyCode(JSON.stringify({ code: 'QUOTA_SPENT', pad: 'x'.repeat(5000) }))).toBeUndefined();
  });

  it('LLM-REQERR-004: the error keeps the message the import has always shown, cut at 300 characters', () => {
    const detail = JSON.stringify({ error: 'over the ceiling', code: 'HARD_CAP' });
    const err = llmRequestError('Anthropic request failed', 429, detail);
    expect(err).toBeInstanceOf(LlmRequestError);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe(`Anthropic request failed (429): ${detail}`);
    expect(err).toMatchObject({ status: 429, code: 'HARD_CAP', name: 'LlmRequestError' });
    expect(llmRequestError('LLM request failed', 500, 'y'.repeat(400)).message).toHaveLength(
      'LLM request failed (500): '.length + 300,
    );
  });
});
