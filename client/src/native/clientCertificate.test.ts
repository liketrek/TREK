import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import {
  certificateTarget,
  clientCertificateSupported,
  removeClientCertificate,
  replaceClientCertificate,
  storedClientCertificate,
} from './clientCertificate';
import { TrekShell } from './trekShell';

vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn() }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: {
    clientCertificate: vi.fn(),
    importClientCertificate: vi.fn(),
    removeClientCertificate: vi.fn(),
  },
}));

const info = { host: 'trek.example.com', port: 443, subject: 'phone', issuer: 'Home CA', notAfter: 1 };
const labels = { title: 't', message: 'm', placeholder: 'p', ok: 'o', cancel: 'c', wrongPassword: 'w' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(hasNativeFeature).mockReturnValue(true);
});

describe('clientCertificate', () => {
  it('asks the binary only where it can hold a certificate', async () => {
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    expect(clientCertificateSupported()).toBe(false);
    expect(await storedClientCertificate()).toBeNull();
    expect(TrekShell.clientCertificate).not.toHaveBeenCalled();
  });

  it('returns the stored certificate, and none when the binary fails', async () => {
    vi.mocked(TrekShell.clientCertificate).mockResolvedValueOnce({ certificate: info });
    expect(await storedClientCertificate()).toEqual(info);
    vi.mocked(TrekShell.clientCertificate).mockRejectedValueOnce(new Error('gone'));
    expect(await storedClientCertificate()).toBeNull();
  });

  it('keeps a certificate for the https host and port of the server, never for plain http', () => {
    expect(certificateTarget('https://Trek.Example.com/')).toEqual({ host: 'trek.example.com', port: 443 });
    expect(certificateTarget('https://nas.local:8443/trek')).toEqual({ host: 'nas.local', port: 8443 });
    expect(certificateTarget('http://nas.local:3001')).toBeNull();
    expect(certificateTarget('not a url')).toBeNull();
  });

  it('imports for the server shown and reports a failed call as a store failure', async () => {
    vi.mocked(TrekShell.importClientCertificate).mockResolvedValueOnce({ result: 'imported', certificate: info });
    await replaceClientCertificate('https://trek.example.com:8443', labels);
    expect(TrekShell.importClientCertificate).toHaveBeenCalledWith({ host: 'trek.example.com', port: 8443, labels });

    vi.mocked(TrekShell.importClientCertificate).mockRejectedValueOnce(new Error('no picker'));
    expect(await replaceClientCertificate('https://trek.example.com', labels)).toEqual({
      result: 'failed',
      failure: 'store',
    });
    expect(await replaceClientCertificate('http://trek.example.com', labels)).toEqual({
      result: 'failed',
      failure: 'format',
    });
  });

  it('says whether removing worked', async () => {
    vi.mocked(TrekShell.removeClientCertificate).mockResolvedValueOnce();
    expect(await removeClientCertificate()).toBe(true);
    vi.mocked(TrekShell.removeClientCertificate).mockRejectedValueOnce(new Error('keychain'));
    expect(await removeClientCertificate()).toBe(false);
  });
});
