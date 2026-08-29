import { ALL_SCOPES } from '../../../src/mcp/scopes';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { ConsentCoopMiddleware } from '../../../src/nest/platform/consent-coop.middleware';
import { DiscoveryMetadataService } from '../../../src/nest/platform/discovery-metadata.service';
import { DiscoveryController } from '../../../src/nest/platform/discovery.controller';
import {
  MCP_METADATA_MIDDLEWARE,
  createMcpMetadataMiddleware,
  mcpMetadataMiddlewareProvider,
} from '../../../src/nest/platform/mcp-metadata.middleware';
import { PlatformModule } from '../../../src/nest/platform/platform.module';
import { mcpAuthMetadataRouter } from '@modelcontextprotocol/sdk/server/auth/router';
import { NotFoundException } from '@nestjs/common';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getMcpSafeUrl: vi.fn(() => 'https://trek.example.test'),
  // The SDK factory returns a tagged middleware so tests can identify delegation
  // without running real router wiring.
  metaRouter: vi.fn(),
}));

vi.mock('../../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/app-config')>();
  return { ...actual, getMcpSafeUrl: h.getMcpSafeUrl };
});
vi.mock('@modelcontextprotocol/sdk/server/auth/router', () => ({
  mcpAuthMetadataRouter: vi.fn(() => h.metaRouter),
}));

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    ended: false,
    status: vi.fn(function (this: typeof res, c: number) {
      this.statusCode = c;
      return this;
    }),
    json: vi.fn(function (this: typeof res, b: unknown) {
      this.body = b;
      return this;
    }),
    end: vi.fn(function (this: typeof res) {
      this.ended = true;
      return this;
    }),
    setHeader: vi.fn(function (this: typeof res, k: string, v: string) {
      this.headers[k] = v;
      return this;
    }),
  };
  return res;
}

function addons(enabled: boolean) {
  return { isAddonEnabled: vi.fn(() => enabled) } as unknown as AddonsService;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getMcpSafeUrl.mockReturnValue('https://trek.example.test');
});

describe('DiscoveryMetadataService', () => {
  it('DISC-001: builds the RFC 8414 AS metadata from the live safe URL', () => {
    const meta = new DiscoveryMetadataService().getOAuthMetadata();
    expect(meta).toEqual({
      issuer: 'https://trek.example.test',
      authorization_endpoint: 'https://trek.example.test/oauth/authorize',
      token_endpoint: 'https://trek.example.test/oauth/token',
      revocation_endpoint: 'https://trek.example.test/oauth/revoke',
      registration_endpoint: 'https://trek.example.test/oauth/register',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
      scopes_supported: ALL_SCOPES,
    });
  });

  it('DISC-002: trims trailing slashes off the configured base URL', () => {
    h.getMcpSafeUrl.mockReturnValue('https://trek.example.test///');
    expect(new DiscoveryMetadataService().getOAuthMetadata().issuer).toBe('https://trek.example.test');
  });

  it('DISC-003: caches the metadata after the first lazy build', () => {
    const svc = new DiscoveryMetadataService();
    const first = svc.getOAuthMetadata();
    expect(svc.getOAuthMetadata()).toBe(first);
    expect(h.getMcpSafeUrl).toHaveBeenCalledTimes(1);
  });

  it('DISC-004: builds the SDK metadata router once, pointing at the /mcp resource', () => {
    const svc = new DiscoveryMetadataService();
    expect(svc.getMetaRouter()).toBe(h.metaRouter);
    expect(svc.getMetaRouter()).toBe(h.metaRouter);
    expect(mcpAuthMetadataRouter).toHaveBeenCalledTimes(1);
    const opts = vi.mocked(mcpAuthMetadataRouter).mock.calls[0][0];
    expect(opts.resourceServerUrl.href).toBe('https://trek.example.test/mcp');
    expect(opts.resourceName).toBe('TREK MCP');
    expect(opts.scopesSupported).toEqual(ALL_SCOPES);
  });
});

describe('createMcpMetadataMiddleware', () => {
  it('DISC-010: 404s a /.well-known path with an empty body when MCP is disabled', () => {
    const mw = createMcpMetadataMiddleware(new DiscoveryMetadataService(), addons(false));
    const res = makeRes();
    const next = vi.fn();
    mw({ path: '/.well-known/oauth-authorization-server' } as never, res as never, next);
    expect(res.statusCode).toBe(404);
    expect(res.ended).toBe(true);
    expect(next).not.toHaveBeenCalled();
    expect(h.metaRouter).not.toHaveBeenCalled();
  });

  it('DISC-011: delegates a /.well-known path to the SDK router when MCP is enabled', () => {
    const mw = createMcpMetadataMiddleware(new DiscoveryMetadataService(), addons(true));
    const next = vi.fn();
    mw({ path: '/.well-known/oauth-authorization-server' } as never, makeRes() as never, next);
    expect(h.metaRouter).toHaveBeenCalled();
  });

  it('DISC-012: delegates non-well-known paths without consulting the addon gate', () => {
    const gate = addons(false);
    const mw = createMcpMetadataMiddleware(new DiscoveryMetadataService(), gate);
    mw({ path: '/api/trips' } as never, makeRes() as never, vi.fn());
    expect(gate.isAddonEnabled).not.toHaveBeenCalled();
    expect(h.metaRouter).toHaveBeenCalled();
  });

  it('DISC-013: the factory provider wires the token to the factory with its two deps', () => {
    expect(mcpMetadataMiddlewareProvider.provide).toBe(MCP_METADATA_MIDDLEWARE);
    expect(mcpMetadataMiddlewareProvider.useFactory).toBe(createMcpMetadataMiddleware);
    expect(mcpMetadataMiddlewareProvider.inject.length).toBe(2);
  });
});

describe('ConsentCoopMiddleware', () => {
  it('DISC-020: relaxes COOP then continues', () => {
    const res = makeRes();
    const next = vi.fn();
    new ConsentCoopMiddleware().use({} as never, res as never, next);
    expect(res.headers['Cross-Origin-Opener-Policy']).toBe('unsafe-none');
    expect(next).toHaveBeenCalled();
  });
});

describe('DiscoveryController', () => {
  function controller(enabled = true) {
    return new DiscoveryController(new DiscoveryMetadataService(), addons(enabled));
  }

  it('DISC-030: openid-configuration is the AS metadata plus userinfo_endpoint', () => {
    const res = makeRes();
    controller().openidConfiguration(res as never);
    const body = res.body as { issuer: string; userinfo_endpoint: string };
    expect(body.issuer).toBe('https://trek.example.test');
    expect(body.userinfo_endpoint).toBe('https://trek.example.test/oauth/userinfo');
  });

  it('DISC-031: flat oauth-protected-resource 404s empty when MCP is disabled', () => {
    const res = makeRes();
    controller(false).protectedResource(res as never);
    expect(res.statusCode).toBe(404);
    expect(res.ended).toBe(true);
  });

  it('DISC-032: flat oauth-protected-resource serves the PRM document when enabled', () => {
    const res = makeRes();
    controller().protectedResource(res as never);
    expect(res.body).toEqual({
      resource: 'https://trek.example.test/mcp',
      authorization_servers: ['https://trek.example.test'],
      bearer_methods_supported: ['header'],
      scopes_supported: ALL_SCOPES,
      resource_name: 'TREK MCP',
    });
  });

  it('DISC-033: the catchall answers 404 JSON, never throwing into the SPA fallback', () => {
    const res = makeRes();
    controller().wellKnownFallback(res as never);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });

  it('DISC-034: /.well-known/ (trailing slash) gets the same 404 JSON', () => {
    const res = makeRes();
    controller().wellKnownRoot({ path: '/.well-known/' } as never, res as never);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });

  it('DISC-035: bare /.well-known reproduces the framework 404 (SpaFallback route)', () => {
    const req = { path: '/.well-known', method: 'GET', originalUrl: '/.well-known' };
    expect(() => controller().wellKnownRoot(req as never, makeRes() as never)).toThrowError(
      new NotFoundException('Cannot GET /.well-known'),
    );
  });

  it('DISC-036: route declaration order keeps the concrete documents ahead of the catchalls', () => {
    // Nest registers routes in method-declaration order; the catchall must not
    // shadow the concrete documents.
    const names = Object.getOwnPropertyNames(DiscoveryController.prototype).filter((n) => n !== 'constructor');
    expect(names.indexOf('openidConfiguration')).toBeLessThan(names.indexOf('wellKnownRoot'));
    expect(names.indexOf('protectedResource')).toBeLessThan(names.indexOf('wellKnownRoot'));
    expect(names.indexOf('wellKnownRoot')).toBeLessThan(names.indexOf('wellKnownFallback'));
  });
});

describe('PlatformModule', () => {
  it('DISC-040: applies the consent COOP middleware to the /oauth/consent prefix', () => {
    const forRoutes = vi.fn();
    const consumer = { apply: vi.fn(() => ({ forRoutes })) };
    new PlatformModule().configure(consumer as never);
    expect(consumer.apply).toHaveBeenCalledWith(ConsentCoopMiddleware);
    expect(forRoutes).toHaveBeenCalledWith('oauth/consent');
  });
});
