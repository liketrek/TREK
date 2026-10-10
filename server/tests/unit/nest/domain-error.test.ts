import { trekMcpErrorMapper } from '../../../src/mcp/nest-mcp-policy';
import {
  badRequest,
  catchDomainError,
  conflict,
  DomainError,
  forbidden,
  notFound,
  unauthorized,
} from '../../../src/nest/common/domain-error';
import { TrekExceptionFilter } from '../../../src/nest/common/trek-exception.filter';
import { HttpException } from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

function mockHost() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    headersSent: false,
  };
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as never;
  return { res, host };
}

describe('DomainError', () => {
  it('carries status, public message, a default code and no details', () => {
    const err = new DomainError(404, 'Trip not found');
    expect(err.getStatus()).toBe(404);
    expect(err.publicMessage).toBe('Trip not found');
    expect(err.message).toBe('Trip not found');
    expect(err.code).toBe('not_found');
    expect(err.details).toBeUndefined();
    expect(err.toBody()).toEqual({ error: 'Trip not found' });
    expect(err).toBeInstanceOf(HttpException);
    expect(err.name).toBe('DomainError');
  });

  it('takes an explicit code and folds details into the body next to error', () => {
    const err = new DomainError(409, 'Taken', { code: 'email_taken', details: { field: 'email' } });
    expect(err.code).toBe('email_taken');
    expect(err.toBody()).toEqual({ field: 'email', error: 'Taken' });
    expect(err.getResponse()).toEqual({ field: 'email', error: 'Taken' });
  });

  it('never lets a detail override the public message', () => {
    expect(new DomainError(400, 'real', { details: { error: 'fake' } }).toBody()).toEqual({ error: 'real' });
  });

  it('names statuses without a table entry by number', () => {
    expect(new DomainError(418, 'teapot').code).toBe('http_418');
    expect(new DomainError(410, 'gone').code).toBe('gone');
  });

  it('has shorthands for the common statuses', () => {
    expect(badRequest('a').getStatus()).toBe(400);
    expect(unauthorized('a').getStatus()).toBe(401);
    expect(forbidden('a').getStatus()).toBe(403);
    expect(notFound('a', { id: 1 }).toBody()).toEqual({ id: 1, error: 'a' });
    expect(conflict('a').getStatus()).toBe(409);
  });
});

describe('catchDomainError', () => {
  it('returns the value of a call that succeeds', async () => {
    expect(await catchDomainError(() => 5)).toEqual({ ok: true, value: 5 });
  });

  it('returns the DomainError a call raised', async () => {
    const err = forbidden('no');
    expect(
      await catchDomainError(async () => {
        throw err;
      }),
    ).toEqual({ ok: false, error: err });
  });

  it('rethrows any other error', async () => {
    await expect(
      catchDomainError(() => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});

describe('TrekExceptionFilter on a DomainError', () => {
  const filter = new TrekExceptionFilter();

  it('writes the status and { error } body verbatim', () => {
    const { res, host } = mockHost();
    filter.catch(new DomainError(410, 'Invite link has expired'), host);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invite link has expired' });
  });

  it('keeps the public message of a 5xx, as the hand-thrown HttpException did', () => {
    const { res, host } = mockHost();
    filter.catch(new DomainError(500, 'Demo user not found'), host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Demo user not found' });
  });

  it('answers byte-identically to the HttpException({ error }) it replaces', () => {
    const before = mockHost();
    const after = mockHost();
    filter.catch(new HttpException({ error: 'Admin access required' }, 403), before.host);
    filter.catch(forbidden('Admin access required'), after.host);
    expect(after.res.status.mock.calls).toEqual(before.res.status.mock.calls);
    expect(after.res.json.mock.calls).toEqual(before.res.json.mock.calls);
  });

  it('writes details next to error', () => {
    const { res, host } = mockHost();
    filter.catch(new DomainError(400, 'Bad', { details: { message: 'kept' } }), host);
    expect(res.json).toHaveBeenCalledWith({ message: 'kept', error: 'Bad' });
  });
});

describe('trekMcpErrorMapper', () => {
  it('turns a DomainError into errorResult(publicMessage)', () => {
    expect(trekMcpErrorMapper(notFound('Trip not found or access denied.'))).toEqual({
      content: [{ type: 'text', text: 'Trip not found or access denied.' }],
      isError: true,
    });
  });

  it('leaves any other error alone', () => {
    expect(trekMcpErrorMapper(new Error('boom'))).toBeUndefined();
    expect(trekMcpErrorMapper(new HttpException('x', 400))).toBeUndefined();
  });
});
