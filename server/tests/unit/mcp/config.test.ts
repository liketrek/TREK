/**
 * MCP env tuning knobs (#1414): MCP_SESSION_TTL + MCP_SSE_KEEPALIVE parsing.
 */
import { describe, it, expect } from 'vitest';
import { resolveSessionTtlMs, resolveKeepaliveMs } from '../../../src/mcp/config';

describe('resolveSessionTtlMs', () => {
  it('defaults to 1 hour when unset or invalid', () => {
    expect(resolveSessionTtlMs(undefined)).toBe(60 * 60 * 1000);
    expect(resolveSessionTtlMs('')).toBe(60 * 60 * 1000);
    expect(resolveSessionTtlMs('nope')).toBe(60 * 60 * 1000);
    expect(resolveSessionTtlMs('0')).toBe(60 * 60 * 1000);
    expect(resolveSessionTtlMs('-5')).toBe(60 * 60 * 1000);
  });

  it('reads seconds from MCP_SESSION_TTL', () => {
    expect(resolveSessionTtlMs('3600')).toBe(3600 * 1000);
    expect(resolveSessionTtlMs('120')).toBe(120 * 1000);
  });

  it('clamps to 24h so a milliseconds typo cannot yield a 1000-hour session', () => {
    expect(resolveSessionTtlMs('3600000')).toBe(24 * 60 * 60 * 1000);
  });
});

describe('resolveKeepaliveMs', () => {
  it('defaults to 25s when unset or invalid', () => {
    expect(resolveKeepaliveMs(undefined)).toBe(25_000);
    expect(resolveKeepaliveMs('abc')).toBe(25_000);
    expect(resolveKeepaliveMs('-1')).toBe(25_000);
  });

  it('reads seconds and allows 0 to disable', () => {
    expect(resolveKeepaliveMs('30')).toBe(30_000);
    expect(resolveKeepaliveMs('0')).toBe(0);
  });
});
