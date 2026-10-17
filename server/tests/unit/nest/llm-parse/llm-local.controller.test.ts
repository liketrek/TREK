import { AdminGuard } from '../../../../src/nest/auth-core/admin.guard';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { MANAGED_FORBIDDEN } from '../../../../src/nest/common/managed';
import type { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import { LlmLocalController } from '../../../../src/nest/llm-parse/llm-local.controller';
import { LlmLocalService } from '../../../../src/nest/llm-parse/llm-local.service';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const readLocalServerAccess = vi.fn();
const resolver = { readLocalServerAccess } as unknown as LlmConfigResolver;

// The real service, so the root comparison under test is the one the
// controller runs; only the two network calls are replaced.
const local = new LlmLocalService();
const listModels = vi.spyOn(local, 'listModels');
const pull = vi.spyOn(local, 'pull');
const controller = new LlmLocalController(local, resolver);

function fakeRes() {
  return { status: vi.fn(), setHeader: vi.fn(), write: vi.fn(), end: vi.fn() };
}

function emptyStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({ start: (c) => c.close() });
}

beforeEach(() => {
  vi.clearAllMocks();
  listModels.mockResolvedValue({ models: [] });
  pull.mockImplementation(async () => emptyStream());
  readLocalServerAccess.mockResolvedValue({ baseUrl: 'https://ollama.example.org/v1', apiKey: 'stored-key' });
});

describe('LlmLocalController (#2649)', () => {
  it('lists the models with the stored key when the URL is the saved server', async () => {
    await controller.models('https://ollama.example.org/v1');
    expect(listModels).toHaveBeenCalledWith('https://ollama.example.org/v1', 'stored-key');
    await controller.models('https://ollama.example.org/');
    expect(listModels).toHaveBeenLastCalledWith('https://ollama.example.org/', 'stored-key');
  });

  it.each([
    'https://evil.example.com/v1',
    'http://ollama.example.org/v1',
    'https://ollama.example.org:8443/v1',
    'https://ollama.example.org/other',
    'https://ollama.example.org@evil.example.com/v1',
    undefined,
  ])('never hands the stored key to a different server (%s)', async (url) => {
    await controller.models(url);
    expect(listModels).toHaveBeenLastCalledWith(url, undefined);
  });

  it('sends no key when none is stored or the provider is not local', async () => {
    readLocalServerAccess.mockResolvedValue(null);
    await controller.models('https://ollama.example.org/v1');
    expect(listModels).toHaveBeenLastCalledWith('https://ollama.example.org/v1', undefined);
    readLocalServerAccess.mockResolvedValue({ baseUrl: 'https://ollama.example.org/v1', apiKey: undefined });
    await controller.models('https://ollama.example.org/v1');
    expect(listModels).toHaveBeenLastCalledWith('https://ollama.example.org/v1', undefined);
  });

  it('pulls with the stored key only for the saved server', async () => {
    await controller.pull({ baseUrl: 'https://ollama.example.org', model: 'nuextract' }, fakeRes() as never);
    expect(pull).toHaveBeenLastCalledWith('https://ollama.example.org', 'nuextract', 'stored-key');
    await controller.pull({ baseUrl: 'https://evil.example.com', model: 'nuextract' }, fakeRes() as never);
    expect(pull).toHaveBeenLastCalledWith('https://evil.example.com', 'nuextract', undefined);
  });

  it('answers a bad base URL before reading the stored key', async () => {
    readLocalServerAccess.mockClear();
    listModels.mockRestore();
    const fresh = new LlmLocalController(new LlmLocalService(), resolver);
    await expect(fresh.models('ftp://x')).rejects.toMatchObject({ status: 400 });
    expect(readLocalServerAccess).not.toHaveBeenCalled();
  });

  it('stays admin-only and forbidden on a managed instance', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, LlmLocalController)).toEqual([JwtAuthGuard, AdminGuard]);
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, LlmLocalController.prototype.models)).toMatchObject({
      enforcedInHandler: false,
    });
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, LlmLocalController.prototype.pull)).toMatchObject({
      enforcedInHandler: false,
    });
  });
});
