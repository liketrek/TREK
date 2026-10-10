/**
 * AD36 (`admin.service.ts#updateAddon`, the LLM-parsing addon's encrypted
 * API key) — Plan 3i Task 1's encryption-boundary proof. Deliberately does
 * NOT mock `apiKeyCrypto` (unlike `admin.service.test.ts`, which stubs it
 * to identity functions) — this file exercises the REAL
 * `maybe_encrypt_api_key`/`decrypt_api_key` so the round trip is genuine,
 * not a no-op through a mock. `ENCRYPTION_KEY` comes from
 * `tests/global-setup.ts`.
 */
import { Addons } from '../../../../src/db/entities/Addons.entity';
import type { AddonsRepository } from '../../../../src/db/repositories/Addons.repository';
import { decrypt_api_key } from '../../../../src/nest/common/crypto/apiKeyCrypto';
import { prepareLlmAddonConfigForWrite } from '../../../../src/nest/llm-parse/llm-config';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows, insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let addons: AddonsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  addons = t.repo(Addons);
});
beforeEach(async () => {
  resetTestDb(testDb);
  await deleteRows(t, Addons);
  await insertRow(t, Addons, {
    id: 'llm_parsing',
    name: 'AI Parsing',
    description: null,
    type: 'global',
    icon: 'Sparkles',
    enabled: false,
    sort_order: 0,
  });
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('AddonsRepository.setConfig — AD36 encryption boundary', () => {
  it('ADDONSREPO-010: the stored apiKey is never the plaintext, but decrypt_api_key always round-trips it back', async () => {
    const plaintext = 'sk-live-abc123-a-real-looking-secret';
    // Mirrors admin.service.ts#updateAddon's own call: the SERVICE encrypts
    // before handing the repository a config object — the repository never
    // calls maybe_encrypt_api_key/decrypt_api_key itself.
    const configToStore = prepareLlmAddonConfigForWrite({ provider: 'openai', apiKey: plaintext }, undefined);

    await addons.setConfig('llm_parsing', configToStore as { apiKey?: string; [k: string]: unknown });

    const row = await addons.findById('llm_parsing');
    const storedApiKey = (row?.config as { apiKey?: string } | null)?.apiKey;

    expect(storedApiKey).toBeDefined();
    // Never assert a literal ciphertext string (the IV is random on every
    // encrypt call, so the exact bytes are non-deterministic) — only that it
    // differs from the plaintext and that the real decrypt function recovers it.
    expect(storedApiKey).not.toBe(plaintext);
    expect(decrypt_api_key(storedApiKey)).toBe(plaintext);
  });

  it('ADDONSREPO-011: a second write of the SAME plaintext produces a different stored ciphertext (random IV), both still decrypting to the same plaintext', async () => {
    const plaintext = 'sk-live-same-secret-both-times';
    const first = prepareLlmAddonConfigForWrite({ apiKey: plaintext }, undefined);
    await addons.setConfig('llm_parsing', first as { apiKey?: string; [k: string]: unknown });
    const firstStored = ((await addons.findById('llm_parsing'))?.config as { apiKey?: string } | null)?.apiKey;

    const second = prepareLlmAddonConfigForWrite({ apiKey: plaintext }, undefined);
    await addons.setConfig('llm_parsing', second as { apiKey?: string; [k: string]: unknown });
    const secondStored = ((await addons.findById('llm_parsing'))?.config as { apiKey?: string } | null)?.apiKey;

    expect(firstStored).not.toBe(secondStored);
    expect(decrypt_api_key(firstStored)).toBe(plaintext);
    expect(decrypt_api_key(secondStored)).toBe(plaintext);
  });
});
