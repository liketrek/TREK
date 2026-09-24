import { describe, expect, it } from 'vitest';
import { HttpException } from '@nestjs/common';
import { ok, type McpTextResult } from '../../../src/nest-mcp';
import { answeringRefusals } from '../../../src/nest/roadtrip/roadtrip-mcp.helpers';

/** A tool body whose service refuses, typed as the answer it never produces. */
const refusing = (body: unknown, status = 400) => (): McpTextResult => { throw new HttpException(body as never, status); };
const failing = (message: string) => (): McpTextResult => { throw new Error(message); };

describe('answeringRefusals', () => {
  it('answers a refusal with the reason the route would send, sync and async', async () => {
    // The `{ error }` body is what the HTTP filter passes through verbatim. Nest sets
    // the exception's message to the class name for such a body, and that is all the
    // SDK would have shown.
    const sync = answeringRefusals(refusing({ error: 'Day end must be later than day start.' }));
    expect(sync).toEqual({ content: [{ type: 'text', text: 'Day end must be later than day start.' }], isError: true });
    const async = await answeringRefusals(async () => refusing({ error: 'Trip not found' }, 404)());
    expect(async).toEqual({ content: [{ type: 'text', text: 'Trip not found' }], isError: true });
  });

  it('takes a string body as the reason and falls back to the message for anything else', () => {
    expect(answeringRefusals(refusing('Permission denied', 403)).content[0].text).toBe('Permission denied');
    expect(answeringRefusals(refusing({ statusCode: 400, message: 'Bad Request' })).content[0].text).toBe('Bad Request');
  });

  it('passes a successful body through untouched', async () => {
    expect(answeringRefusals(() => ok({ n: 1 }))).toEqual(ok({ n: 1 }));
    expect(await answeringRefusals(async () => ok({ n: 2 }))).toEqual(ok({ n: 2 }));
  });

  it('keeps propagating anything that is not a refusal', async () => {
    // A 5xx is a failure to be logged and reported like any other, not an answer,
    // and an ordinary error is not the SDK's to swallow either.
    expect(() => answeringRefusals(refusing({ error: 'boom' }, 500))).toThrow(HttpException);
    expect(() => answeringRefusals(failing('plain'))).toThrow('plain');
    await expect(answeringRefusals(async () => failing('later')())).rejects.toThrow('later');
  });
});
