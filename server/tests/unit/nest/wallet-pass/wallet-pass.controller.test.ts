import { DomainError } from '../../../../src/nest/common/domain-error';
import { WalletPassController } from '../../../../src/nest/wallet-pass/wallet-pass.controller';
import type { User } from '../../../../src/types';

import { describe, expect, it, vi } from 'vitest';

function response() {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 0,
    contentType: '',
    body: undefined as unknown,
    set: vi.fn((name: string, value: string) => {
      res.headers[name] = value;
      return res;
    }),
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    type: vi.fn((t: string) => {
      res.contentType = t;
      return res;
    }),
    send: vi.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

const user = { id: 5 } as User;

describe('WalletPassController', () => {
  it('WALLET-C-001: answers the pass as a download that is never cached, in the asked language', async () => {
    const passFor = vi.fn(async () => ({ bytes: Buffer.from('PK\u0003\u0004'), filename: 'LH-716.pkpass' }));
    const controller = new WalletPassController({ passFor } as never);
    const res = response();
    await controller.pass(user, 42, 7, 'ja', res as never);
    expect(passFor).toHaveBeenCalledWith(5, 42, 7, 'ja');
    expect(res.statusCode).toBe(200);
    expect(res.contentType).toBe('application/vnd.apple.pkpass');
    expect(res.headers['Content-Disposition']).toBe('attachment; filename="LH-716.pkpass"');
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('WALLET-C-002: an unknown language falls back to English; a refusal is passed on', async () => {
    const passFor = vi.fn(async () => {
      throw new DomainError(422, 'A booking needs a date for a Wallet pass');
    });
    const controller = new WalletPassController({ passFor } as never);
    await expect(controller.pass(user, 42, 7, 'klingon', response() as never)).rejects.toBeInstanceOf(DomainError);
    expect(passFor).toHaveBeenCalledWith(5, 42, 7, 'en');
  });

  it('WALLET-C-003: Google Wallet answers the save link as JSON, in the asked language', async () => {
    const googleSaveUrlFor = vi.fn(async () => 'https://pay.google.com/gp/v/save/abc');
    const controller = new WalletPassController({ googleSaveUrlFor } as never);
    await expect(controller.google(user, 42, 7, 'fr')).resolves.toEqual({
      saveUrl: 'https://pay.google.com/gp/v/save/abc',
    });
    expect(googleSaveUrlFor).toHaveBeenCalledWith(5, 42, 7, 'fr');
  });
});
