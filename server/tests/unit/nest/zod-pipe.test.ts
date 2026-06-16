import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { HttpException } from '@nestjs/common';
import { ZodValidationPipe } from '../../../src/nest/common/zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(z.object({ name: z.string().min(1) }));
  const meta = {} as never;

  it('returns the parsed value for valid input', () => {
    expect(pipe.transform({ name: 'x' }, meta)).toEqual({ name: 'x' });
  });

  it('throws TREK { error } envelope with status 400 on invalid input', () => {
    let thrown: unknown;
    try {
      pipe.transform({ name: '' }, meta);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(400);
    expect((thrown as HttpException).getResponse()).toHaveProperty('error');
  });

  it("labels a root-level (empty path) issue as 'body'", () => {
    const rootPipe = new ZodValidationPipe(z.string());
    let thrown: unknown;
    try {
      rootPipe.transform(123, meta);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    const body = (thrown as HttpException).getResponse() as { error: string };
    expect(body.error).toMatch(/^body: /);
  });

  it('joins multiple issues with a semicolon', () => {
    const multiPipe = new ZodValidationPipe(z.object({ a: z.string(), b: z.number() }));
    let thrown: unknown;
    try {
      multiPipe.transform({ a: 1, b: 'x' }, meta);
    } catch (e) {
      thrown = e;
    }
    const body = (thrown as HttpException).getResponse() as { error: string };
    expect(body.error).toContain('a: ');
    expect(body.error).toContain('b: ');
    expect(body.error).toContain('; ');
  });
});
