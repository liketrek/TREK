import { describe, expect, it, vi } from 'vitest';
import { candidateUrls, certificateTargetFor, probeDemo, probeServer, type ProbeResponse } from './serverAddress';

const features = (
  url: string,
  data: unknown = { bookingImport: false, aiParsing: false, nativeApp: true, nativeApi: 3 }
): ProbeResponse => ({ status: 200, data, url });

describe('candidateUrls', () => {
  it('tries https before http when no scheme was typed', () => {
    expect(candidateUrls('trek.example.com')).toEqual(['https://trek.example.com', 'http://trek.example.com']);
    expect(candidateUrls(' 192.168.1.10:3001/ ')).toEqual(['https://192.168.1.10:3001', 'http://192.168.1.10:3001']);
  });

  it('keeps an explicit scheme and path, without query, hash or trailing slashes', () => {
    expect(candidateUrls('http://nas.local:3001/trek/?x=1#y')).toEqual(['http://nas.local:3001/trek']);
    expect(candidateUrls('HTTPS://Trek.Example.com//')).toEqual(['https://trek.example.com']);
  });

  it('returns nothing for empty input or other schemes', () => {
    expect(candidateUrls('   ')).toEqual([]);
    expect(candidateUrls('ftp://trek.example.com')).toEqual([]);
    expect(candidateUrls('javascript://alert(1)')).toEqual([]);
  });
});

describe('certificateTargetFor', () => {
  it('keeps a certificate for the https address the typed text stands for', () => {
    expect(certificateTargetFor('Trek.Example.com')).toEqual({ host: 'trek.example.com', port: 443 });
    expect(certificateTargetFor(' nas.local:8443/trek ')).toEqual({ host: 'nas.local', port: 8443 });
    expect(certificateTargetFor('https://trek.example.com:443/')).toEqual({ host: 'trek.example.com', port: 443 });
  });

  it('has no target for a plain http address or nothing typed', () => {
    expect(certificateTargetFor('http://nas.local:3001')).toBeNull();
    expect(certificateTargetFor('')).toBeNull();
    expect(certificateTargetFor('   ')).toBeNull();
    expect(certificateTargetFor('ftp://trek.example.com')).toBeNull();
  });
});

describe('probeServer', () => {
  it('accepts a server at the minimum native API version or above', async () => {
    for (const nativeApi of [3, 4]) {
      const data = { bookingImport: false, nativeApp: true, nativeApi };
      const get = vi.fn().mockResolvedValue(features('https://trek.example.com/api/health/features', data));
      expect(await probeServer('https://trek.example.com', get)).toEqual({ ok: true, url: 'https://trek.example.com' });
    }
  });

  it('calls a server below the minimum native API version too old', async () => {
    const data = { bookingImport: false, nativeApp: true, nativeApi: 2 };
    const get = vi.fn().mockResolvedValue(features('https://trek.example.com/api/health/features', data));
    expect(await probeServer('https://trek.example.com', get)).toEqual({ ok: false, reason: 'tooOld' });
  });

  it('calls a server that speaks to the app but reports no native API version too old', async () => {
    const data = { bookingImport: false, nativeApp: true };
    const get = vi.fn().mockResolvedValue(features('https://trek.example.com/api/health/features', data));
    expect(await probeServer('https://trek.example.com', get)).toEqual({ ok: false, reason: 'tooOld' });
  });

  it('accepts a server that reports nativeApp and follows its redirect', async () => {
    const get = vi.fn().mockResolvedValue(features('https://trek.example.com/api/health/features'));
    expect(await probeServer('http://trek.example.com', get)).toEqual({ ok: true, url: 'https://trek.example.com' });
    expect(get).toHaveBeenCalledWith('http://trek.example.com/api/health/features');
  });

  it('falls back to the candidate itself when the final URL is not the probe path', async () => {
    const get = vi.fn().mockResolvedValue(features('https://sso.example.com/login'));
    expect(await probeServer('https://trek.example.com', get)).toEqual({ ok: true, url: 'https://trek.example.com' });
  });

  it('moves on to plain http when https cannot be reached', async () => {
    const get = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(features('http://192.168.1.10:3001/api/health/features'));
    expect(await probeServer('192.168.1.10:3001', get)).toEqual({ ok: true, url: 'http://192.168.1.10:3001' });
    expect(get).toHaveBeenNthCalledWith(2, 'http://192.168.1.10:3001/api/health/features');
  });

  it('names a TREK server without the native flag as too old', async () => {
    const get = vi
      .fn()
      .mockResolvedValue(
        features('https://old.example.com/api/health/features', { bookingImport: true, aiParsing: false })
      );
    expect(await probeServer('https://old.example.com', get)).toEqual({ ok: false, reason: 'tooOld' });
  });

  it('tells a server that is not TREK apart from one that is not there', async () => {
    const html = vi
      .fn()
      .mockResolvedValue({ status: 200, data: '<html>', url: 'https://x.example.com/api/health/features' });
    expect(await probeServer('https://x.example.com', html)).toEqual({ ok: false, reason: 'notTrek' });

    const missing = vi
      .fn()
      .mockResolvedValue({ status: 404, data: {}, url: 'https://x.example.com/api/health/features' });
    expect(await probeServer('https://x.example.com', missing)).toEqual({ ok: false, reason: 'notTrek' });

    const down = vi.fn().mockRejectedValue(new Error('timeout'));
    expect(await probeServer('x.example.com', down)).toEqual({ ok: false, reason: 'unreachable' });
  });

  it('keeps the most telling failure across candidates', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce(features('https://nas.local/api/health/features', { bookingImport: false }))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await probeServer('nas.local', get)).toEqual({ ok: false, reason: 'tooOld' });
  });

  it('refuses input that is not an address', async () => {
    const get = vi.fn();
    expect(await probeServer('', get)).toEqual({ ok: false, reason: 'invalid' });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('probeDemo', () => {
  it('probes the public demo server the address screen offers', async () => {
    const get = vi.fn().mockResolvedValue(features('https://demo.liketrek.com/api/health/features'));
    expect(await probeDemo(get)).toEqual({ ok: true, url: 'https://demo.liketrek.com' });
    expect(get).toHaveBeenCalledWith('https://demo.liketrek.com/api/health/features');
  });
});

describe('probeServer behind a sign-in proxy', () => {
  it('reports the gate, the server it guards and the host its sign-in lives on', async () => {
    const get = vi.fn().mockResolvedValue({
      status: 200,
      url: 'https://pangolin.example.com/auth/resource/3?redirect=https%3A%2F%2Ftrek.example.com',
      data: '<html><title>Pangolin</title><form><input type="password"></form></html>',
    } satisfies ProbeResponse);
    expect(await probeServer('trek.example.com', get)).toEqual({
      ok: false,
      reason: 'authGate',
      url: 'https://trek.example.com',
      gate: { kind: 'pangolin', loginHost: 'pangolin.example.com' },
    });
  });

  it('asks the start page for the sign-in host when the API path only got a 401', async () => {
    const get = vi.fn(async (url: string): Promise<ProbeResponse> =>
      url.endsWith('/api/health/features')
        ? { status: 401, url, data: '<html>Authelia</html>' }
        : {
            status: 200,
            url: 'https://auth.example.com/?rd=https%3A%2F%2Ftrek.example.com%2F',
            data: '<html>Authelia</html>',
          }
    );
    const result = await probeServer('https://trek.example.com', get);
    expect(result).toMatchObject({ reason: 'authGate', gate: { kind: 'authelia', loginHost: 'auth.example.com' } });
    expect(get).toHaveBeenCalledWith('https://trek.example.com/');
  });

  it('keeps calling an address that is simply something else not TREK', async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ status: 200, url: 'https://x.example.com/api/health/features', data: { hello: 1 } });
    expect(await probeServer('https://x.example.com', get)).toEqual({ ok: false, reason: 'notTrek' });
  });
});

describe('probeServer behind mutual TLS', () => {
  const asked = (status: number, sent: boolean, data: unknown = ''): ProbeResponse => ({
    status,
    data,
    url: 'https://trek.example.com/api/health/features',
    clientCert: { requested: true, sent },
  });

  it('names a handshake the proxy broke off for want of a certificate, with the host to add one for', async () => {
    const get = vi.fn().mockResolvedValue(asked(0, false));
    expect(await probeServer('trek.example.com', get)).toEqual({
      ok: false,
      reason: 'clientCert',
      url: 'https://trek.example.com',
      cert: { host: 'trek.example.com', port: 443, sent: false },
    });
  });

  it("names Cloudflare's 403 without a certificate the same way, port included", async () => {
    const get = vi.fn().mockResolvedValue(asked(403, false, 'Access denied'));
    const result = await probeServer('https://Trek.Example.com:8443', get);
    expect(result.reason).toBe('clientCert');
    expect(result.cert).toEqual({ host: 'trek.example.com', port: 8443, sent: false });
  });

  it('says the proxy refused the certificate the app showed', async () => {
    const get = vi.fn().mockResolvedValue(asked(400, true, '400 The SSL certificate error'));
    expect((await probeServer('https://trek.example.com', get)).cert?.sent).toBe(true);
  });

  it('connects where the proxy asked and TREK answered, with or without a certificate', async () => {
    const trek = { bookingImport: false, nativeApp: true, nativeApi: 3 };
    for (const sent of [true, false]) {
      const get = vi.fn().mockResolvedValue(asked(200, sent, trek));
      expect(await probeServer('https://trek.example.com', get)).toEqual({ ok: true, url: 'https://trek.example.com' });
    }
  });

  it('keeps a failed connection without an ask unreachable, and ranks the ask above it', async () => {
    const down = vi.fn().mockResolvedValue({ status: 0, data: '', url: 'https://trek.example.com' });
    expect(await probeServer('https://trek.example.com', down)).toEqual({ ok: false, reason: 'unreachable' });

    const mixed = vi
      .fn()
      .mockResolvedValueOnce(asked(0, false))
      .mockResolvedValueOnce({ status: 0, data: '', url: 'http://trek.example.com' });
    expect((await probeServer('trek.example.com', mixed)).reason).toBe('clientCert');
  });
});
