import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { MulterError } from 'multer';
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

  it('maps a multer LIMIT_FILE_SIZE error to 413 with the multer message', () => {
    const { res, host } = mockHost();
    filter.catch(new MulterError('LIMIT_FILE_SIZE', 'avatar'), host);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: 'File too large' });
  });

  it('maps any other multer error to 400 with the multer message', () => {
    const { res, host } = mockHost();
    const err = new MulterError('LIMIT_UNEXPECTED_FILE', 'avatar');
    filter.catch(err, host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: err.message });
  });

  it('normalises a Nest-shaped { statusCode, message, error } body to { error }', () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException({ statusCode: 400, message: 'Validation failed', error: 'Bad Request' }, 400), host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Validation failed' });
  });

  it('joins an array message into a single string', () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException({ message: ['too short', 'required'] }, 400), host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'too short, required' });
  });

  it('falls back to obj.error when an object body has no message', () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException({ statusCode: 400, error: 'Bad Request' }, 400), host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request' });
  });

  it("uses 'Error' when an object body carries neither message nor error", () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException({ statusCode: 400 }, 400), host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error' });
  });

  it('hides 5xx object-body details behind Internal server error', () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException({ message: 'secret stack detail' }, 503), host);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('maps a plain error with statusCode to that status (4xx exposes message)', () => {
    const { res, host } = mockHost();
    filter.catch({ statusCode: 400, message: 'Only images are allowed' }, host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Only images are allowed' });
  });

  it('honours a plain error status field when statusCode is absent', () => {
    const { res, host } = mockHost();
    filter.catch({ status: 404, message: 'Not here' }, host);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not here' });
  });

  it("uses 'Error' for a 4xx plain error with no message", () => {
    const { res, host } = mockHost();
    filter.catch({ statusCode: 422 }, host);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error' });
  });

  it('hides a 5xx string-body HttpException behind Internal server error', () => {
    const { res, host } = mockHost();
    filter.catch(new HttpException('database exploded', 500), host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('treats a null exception as a 500', () => {
    const { res, host } = mockHost();
    filter.catch(null, host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
