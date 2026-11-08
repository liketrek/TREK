import { describe, expect, it } from 'vitest';
import { canSignInInApp, detectAuthGate } from './authGate';

const REQUESTED = 'https://trek.example.com/api/health/features';
const page = (html: string) => `<!doctype html><html><head><title>Sign in</title></head><body>${html}</body></html>`;

describe('detectAuthGate', () => {
  it('names Cloudflare Access by its team domain and keeps that host for the sign-in', () => {
    const gate = detectAuthGate(REQUESTED, {
      status: 200,
      url: 'https://team.cloudflareaccess.com/cdn-cgi/access/login/trek.example.com?redirect_url=%2F',
      data: page('<form>Get a login code emailed to you</form>'),
    });
    expect(gate).toEqual({ kind: 'cloudflare', loginHost: 'team.cloudflareaccess.com' });
  });

  it('names Pangolin, authentik, Authelia and OAuth2 Proxy by their pages or paths', () => {
    expect(
      detectAuthGate(REQUESTED, {
        status: 200,
        url: 'https://pangolin.example.com/auth/resource/7?redirect=x',
        data: page(''),
      })
    ).toEqual({ kind: 'pangolin', loginHost: 'pangolin.example.com' });
    expect(
      detectAuthGate(REQUESTED, {
        status: 200,
        url: 'https://trek.example.com/outpost.goauthentik.io/start',
        data: page(''),
      })
    ).toEqual({ kind: 'authentik', loginHost: null });
    expect(
      detectAuthGate(REQUESTED, {
        status: 200,
        url: 'https://auth.example.com/?rd=x',
        data: page('<div>Authelia</div>'),
      })
    ).toEqual({ kind: 'authelia', loginHost: 'auth.example.com' });
    expect(
      detectAuthGate(REQUESTED, { status: 403, url: 'https://trek.example.com/oauth2/sign_in', data: page('') })
    ).toEqual({ kind: 'oauth2proxy', loginHost: null });
  });

  it("recognises a reverse proxy's password prompt, which cannot be signed in to inside the app", () => {
    const gate = detectAuthGate(REQUESTED, {
      status: 401,
      url: REQUESTED,
      data: '',
      headers: { 'WWW-Authenticate': 'Basic realm="trek"' },
    });
    expect(gate).toEqual({ kind: 'basic', loginHost: null });
    expect(canSignInInApp(gate!)).toBe(false);
  });

  it('calls any other sign-in page an unknown gate', () => {
    const gate = detectAuthGate(REQUESTED, {
      status: 200,
      url: 'https://sso.example.com/login',
      data: page('<input type="password">'),
    });
    expect(gate).toEqual({ kind: 'unknown', loginHost: 'sso.example.com' });
    expect(canSignInInApp(gate!)).toBe(true);
  });

  it('sees no gate in a server that is simply something else', () => {
    expect(detectAuthGate(REQUESTED, { status: 200, url: REQUESTED, data: { status: 'ok' } })).toBeNull();
    expect(
      detectAuthGate(REQUESTED, { status: 404, url: REQUESTED, data: page('<h1>Welcome to nginx</h1>') })
    ).toBeNull();
  });
});
