import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { TrekExceptionFilter } from '../../../src/nest/common/trek-exception.filter';

function mockHost() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as never;
  return { res, host };
}

describe('TrekExceptionFilter', () => {
  const filter = new TrekExceptionFilter();

  it('passes through { error, code } bodies (auth guards) unchanged', () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException({ error: 'Access token required', code: 'AUTH_REQUIRED' }, 401), host);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required', code: 'AUTH_REQUIRED' });
  });

  it('normalises a string HttpException to { error }', () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException('Bad thing', 400), host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad thing' });
  });

  it('maps unknown errors to 500 { error: Internal server error }', () => {
    const { res, host } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
