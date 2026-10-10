/**
 * @ResponseContract (src/nest/common/response-contract.ts): under NODE_ENV=test every
 * response of a decorated handler is parsed against its shared schema, and one the
 * schema does not describe fails the request; the body itself is never rewritten.
 */
import {
  RESPONSE_CONTRACT_KEY,
  ResponseContract,
  ResponseContractInterceptor,
  ResponseContractViolation,
  assertResponseContract,
  responseContractsEnforced,
} from '../../../../src/nest/common/response-contract';
import { TrekExceptionFilter } from '../../../../src/nest/common/trek-exception.filter';
import { Controller, Get, Module, type CallHandler, type ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { lastValueFrom, of } from 'rxjs';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const itemSchema = z.object({ id: z.number(), name: z.string() });

function context(): ExecutionContext {
  class ItemsController {}
  function show() {}
  return { getClass: () => ItemsController, getHandler: () => show } as unknown as ExecutionContext;
}

const handled = (body: unknown): CallHandler => ({ handle: () => of(body) });

describe('assertResponseContract', () => {
  it('passes a body the schema describes', () => {
    expect(() => assertResponseContract(itemSchema, { id: 1, name: 'a' }, 'X.y')).not.toThrow();
  });

  it('names the handler and the first issues of a body it does not describe', () => {
    expect(() => assertResponseContract(itemSchema, { id: '1' }, 'ItemsController.show')).toThrow(
      /^ItemsController\.show answered outside its response contract: id: .*; name: /,
    );
  });

  it('marks the root when the body itself is wrong', () => {
    expect(() => assertResponseContract(itemSchema, undefined, 'X.y')).toThrow(/: \(root\): /);
  });

  it('names at most five issues', () => {
    const wide = z.object(Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`f${i}`, z.string()])));
    try {
      assertResponseContract(wide, {}, 'X.y');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ResponseContractViolation);
      expect((e as Error).message.split('; ')).toHaveLength(5);
    }
  });
});

describe('ResponseContractInterceptor', () => {
  it('hands the body on untouched, extra keys included', async () => {
    const body = { id: 1, name: 'a', extra: true };
    const out = await lastValueFrom(new ResponseContractInterceptor(itemSchema).intercept(context(), handled(body)));
    expect(out).toBe(body);
  });

  it('fails a body outside the schema with the handler named', async () => {
    const run = lastValueFrom(new ResponseContractInterceptor(itemSchema).intercept(context(), handled({ id: 1 })));
    await expect(run).rejects.toThrow(/ItemsController\.show answered outside its response contract: name: /);
  });
});

describe('ResponseContract', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is enforced under NODE_ENV=test only', () => {
    expect(responseContractsEnforced()).toBe(true);
    vi.stubEnv('NODE_ENV', 'production');
    expect(responseContractsEnforced()).toBe(false);
  });

  it('records the schema on the handler', () => {
    class C {
      @ResponseContract(itemSchema)
      show() {
        return { id: 1, name: 'a' };
      }
    }
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, C.prototype.show)).toBe(itemSchema);
    expect(Reflect.getMetadata('__interceptors__', C.prototype.show)).toHaveLength(1);
  });

  it('adds no interceptor outside of tests, so production requests carry no check', () => {
    vi.stubEnv('NODE_ENV', 'production');
    class C {
      @ResponseContract(itemSchema)
      show() {
        return { id: 1 };
      }
    }
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, C.prototype.show)).toBe(itemSchema);
    expect(Reflect.getMetadata('__interceptors__', C.prototype.show)).toBeUndefined();
  });

  it('answers a drifted response with the generic 500 and logs which handler drifted', async () => {
    @Controller('items')
    class ItemsController {
      @Get('good')
      @ResponseContract(itemSchema)
      good() {
        return { id: 1, name: 'a' };
      }

      @Get('bad')
      @ResponseContract(itemSchema)
      bad() {
        return { id: 1, title: 'a' };
      }
    }
    @Module({ controllers: [ItemsController] })
    class ItemsModule {}

    const moduleRef = await Test.createTestingModule({ imports: [ItemsModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalFilters(new TrekExceptionFilter());
    await app.init();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const good = await request(app.getHttpServer()).get('/items/good');
      expect(good.status).toBe(200);
      expect(good.body).toEqual({ id: 1, name: 'a' });

      const bad = await request(app.getHttpServer()).get('/items/bad');
      expect(bad.status).toBe(500);
      expect(bad.body).toEqual({ error: 'Internal server error' });
      expect(String(logged.mock.calls[0]?.[1])).toMatch(
        /ItemsController\.bad answered outside its response contract: name: /,
      );
    } finally {
      logged.mockRestore();
      await app.close();
    }
  });
});
