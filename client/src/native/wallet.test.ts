import { beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ ios: true, wallet: true }));
const shell = vi.hoisted(() => ({ addToWallet: vi.fn() }));
const report = vi.hoisted(() => vi.fn());

vi.mock('./platform', () => ({ isNativeIos: () => env.ios }));
vi.mock('./capabilities', () => ({ hasNativeFeature: (name: string) => name === 'wallet' && env.wallet }));
vi.mock('./trekShell', () => ({ TrekShell: shell }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: report }));

import { addToWallet, canAddToWallet, isWalletPassName } from './wallet';

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
