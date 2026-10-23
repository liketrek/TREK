/**
 * AiConnectionsRepository and the table under it: one connection per user and
 * one for the instance, a save that replaces in place, the version check a
 * token refresh writes under, and the checks that keep a custom server the
 * admin's while a ChatGPT sign-in may be either side's.
 */
import { AiConnections } from '../../../../src/db/entities/AiConnections.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { AiConnectionsRepository } from '../../../../src/db/repositories/AiConnections.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, deleteRows, findRow, insertRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: AiConnectionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(AiConnections);
});
beforeEach(async () => {
  t.clear();
  await deleteRows(t, AiConnections);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const KEY = { kind: 'anthropic', model: 'claude', baseUrl: null, secrets: 'enc:v1:a', hint: '…aaaa', account: null };

describe('AiConnectionsRepository', () => {
  it('AICREPO-001: a user and the instance each have one connection; a second save replaces it in place', async () => {
    const { user } = await makeUser(t);
    await repo.save(user.id, KEY);
    await repo.save(null, { ...KEY, kind: 'custom', baseUrl: 'http://ollama:11434/v1', secrets: null, hint: null });
    const first = await repo.findForUser(user.id);
    expect(first).toMatchObject({
      scope: 'user',
      user_id: user.id,
      kind: 'anthropic',
      secrets_version: 0,
      status: 'ok',
    });

    await repo.setStatus(first?.id ?? 0, 'error');
    await repo.save(user.id, { ...KEY, kind: 'openai', model: 'gpt', secrets: 'enc:v1:b' });
    const second = await repo.findForUser(user.id);
    expect(second).toMatchObject({ id: first?.id, kind: 'openai', model: 'gpt', secrets_version: 1, status: 'ok' });
    expect(await repo.findInstance()).toMatchObject({
      scope: 'instance',
      user_id: null,
      base_url: 'http://ollama:11434/v1',
    });
    expect(await countRows(t, AiConnections)).toBe(2);
  });

  it('AICREPO-002: a refresh writes only over the version it read', async () => {
    const { user } = await makeUser(t);
    await repo.save(user.id, { ...KEY, kind: 'chatgpt' });
    const row = await repo.findForUser(user.id);
    const id = row?.id ?? 0;
    expect(await repo.replaceSecretsIfUnchanged(id, 0, 'enc:v1:new', '{"sub":"s"}')).toBe(true);
    expect(await repo.replaceSecretsIfUnchanged(id, 0, 'enc:v1:late', null)).toBe(false);
    expect(await repo.findById(id)).toMatchObject({
      secrets: 'enc:v1:new',
      secrets_version: 1,
      account: '{"sub":"s"}',
    });

    await repo.clearSecrets(id, 'signed_out');
    expect(await repo.findById(id)).toMatchObject({ secrets: null, secrets_version: 2, status: 'signed_out' });
    await repo.setModel(id, 'gpt-6');
    expect((await repo.findById(id))?.model).toBe('gpt-6');
    expect(await repo.deleteById(id)).toBe(1);
    expect(await repo.findById(id)).toBeNull();
  });

  it('AICREPO-003: the table refuses a custom user connection and a stray base URL, takes a shared ChatGPT plan', async () => {
    const { user } = await makeUser(t);
    await expect(repo.save(user.id, { ...KEY, kind: 'custom', baseUrl: 'http://lan' })).rejects.toThrow(/CHECK/);
    await expect(repo.save(null, { ...KEY, baseUrl: 'http://lan' })).rejects.toThrow(/CHECK/);
    await expect(repo.save(null, { ...KEY, kind: 'custom' })).rejects.toThrow(/CHECK/);
    await expect(insertRow(t, AiConnections, { scope: 'user', kind: 'openai', model: 'm' })).rejects.toThrow(/CHECK/);
    // An admin may share their own ChatGPT plan with everyone.
    await repo.save(null, { ...KEY, kind: 'chatgpt' });
    expect(await repo.findInstance()).toMatchObject({ scope: 'instance', user_id: null, kind: 'chatgpt' });
  });

  it('AICREPO-004: a user deleted takes their connection along', async () => {
    const { user } = await makeUser(t);
    await repo.save(user.id, KEY);
    await deleteRows(t, Users, { id: user.id });
    expect(await findRow(t, AiConnections, { user: user.id })).toBeNull();
  });
});
