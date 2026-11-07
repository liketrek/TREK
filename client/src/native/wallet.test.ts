import { beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ ios: true, wallet: true }));
const shell = vi.hoisted(() => ({ addToWallet: vi.fn() }));
const report = vi.hoisted(() => vi.fn());

vi.mock('./platform', () => ({ isNativeIos: () => env.ios }));
vi.mock('./capabilities', () => ({ hasNativeFeature: (name: string) => name === 'wallet' && env.wallet }));
vi.mock('./trekShell', () => ({ TrekShell: shell }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: report }));

import { addReservationToWallet, addToWallet, canAddToWallet, isWalletPassName } from './wallet';

const pass = new Blob(['PK\u0003\u0004pass'], { type: 'application/vnd.apple.pkpass' });

beforeEach(() => {
  env.ios = true;
  env.wallet = true;
  shell.addToWallet.mockReset();
  report.mockReset();
});

describe('Apple Wallet', () => {
  it('knows a pass by its name', () => {
    expect(isWalletPassName('Boarding Pass.pkpass')).toBe(true);
    expect(isWalletPassName('TICKET.PKPASS ')).toBe(true);
    expect(isWalletPassName('passes.pkpasses')).toBe(false);
    expect(isWalletPassName('booking.pdf')).toBe(false);
  });

  it('is offered only on iOS with the wallet feature', () => {
    expect(canAddToWallet()).toBe(true);
    env.wallet = false;
    expect(canAddToWallet()).toBe(false);
    env.wallet = true;
    env.ios = false;
    expect(canAddToWallet()).toBe(false);
  });

  it('hands the pass to Wallet as base64', async () => {
    shell.addToWallet.mockResolvedValue({ result: 'added' });
    expect(await addToWallet(pass)).toBe(true);
    const { data } = shell.addToWallet.mock.calls[0][0] as { data: string };
    expect(atob(data)).toBe('PK\u0003\u0004pass');
  });

  it('falls back quietly for a broken pass or no Wallet, and reports anything else', async () => {
    shell.addToWallet.mockRejectedValue({ code: 'INVALID' });
    expect(await addToWallet(pass)).toBe(false);
    shell.addToWallet.mockRejectedValue({ code: 'UNAVAILABLE' });
    expect(await addToWallet(pass)).toBe(false);
    expect(report).not.toHaveBeenCalled();

    shell.addToWallet.mockRejectedValue(new Error('bridge gone'));
    expect(await addToWallet(pass)).toBe(false);
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('does not touch the bridge where it cannot add a pass', async () => {
    env.ios = false;
    expect(await addToWallet(pass)).toBe(false);
    expect(shell.addToWallet).not.toHaveBeenCalled();
  });
});

describe('a booking into Wallet', () => {
  const answer = (status: number) =>
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(status === 200 ? pass : '{}', { status }));

  it('fetches the booking pass in the user language and hands it to Wallet', async () => {
    const fetchSpy = answer(200);
    shell.addToWallet.mockResolvedValue({ result: 'added' });
    expect(await addReservationToWallet(42, 7, 'de')).toBe('added');
    expect(fetchSpy).toHaveBeenCalledWith('/api/trips/42/reservations/7/wallet-pass?lang=de', {
      credentials: 'include',
    });
    fetchSpy.mockRestore();
  });

  it('tells an undated booking from a failure', async () => {
    let fetchSpy = answer(422);
    expect(await addReservationToWallet(42, 7, 'en')).toBe('undated');
    fetchSpy.mockRestore();
    fetchSpy = answer(502);
    expect(await addReservationToWallet(42, 7, 'en')).toBe('failed');
    fetchSpy.mockRestore();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    expect(await addReservationToWallet(42, 7, 'en')).toBe('failed');
    fetchSpy.mockRestore();
  });

  it('fails when Wallet does not take the pass', async () => {
    const fetchSpy = answer(200);
    shell.addToWallet.mockRejectedValue({ code: 'INVALID' });
    expect(await addReservationToWallet(42, 7, 'en')).toBe('failed');
    fetchSpy.mockRestore();
  });
});
