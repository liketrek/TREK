import { Users } from '../../../src/db/entities/Users.entity';
import { encrypt_api_key } from '../../../src/nest/common/crypto/apiKeyCrypto';
import { encryptMfaSecret } from '../../../src/nest/common/crypto/mfaCrypto';
import { nextSeq, type FactoryOrm } from './context';
import { createRow, findRow, updateRows } from './rows';
import type { EntityDTO } from '@mikro-orm/core';

import bcrypt from 'bcryptjs';

export type UserRow = EntityDTO<Users>;

export interface UserOverrides {
  /** Pin the id, for suites whose session cookie is signed for a fixed user. */
  id?: number;
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
  password_version?: number;
  is_guest?: number;
  display_name?: string | null;
  must_change_password?: number;
}

/**
 * A user with a known password, stored as a bcrypt hash at cost 4 so tests
 * stay fast. Defaults are unique per worker: `testuser<n>`,
 * `user<n>@test.example.com`, `TestPass<n>!`.
 */
export async function makeUser(
  orm: FactoryOrm,
  overrides: UserOverrides = {},
): Promise<{ user: UserRow; password: string }> {
  const n = nextSeq('user');
  const password = overrides.password ?? `TestPass${n}!`;
  const user = await createRow(orm, Users, {
    ...(overrides.id !== undefined ? { id: overrides.id } : {}),
    username: overrides.username ?? `testuser${n}`,
    email: overrides.email ?? `user${n}@test.example.com`,
    password_hash: bcrypt.hashSync(password, 4),
    role: overrides.role ?? 'user',
    password_version: overrides.password_version ?? 0,
    is_guest: overrides.is_guest ?? 0,
    display_name: overrides.display_name ?? null,
    must_change_password: overrides.must_change_password ?? 0,
  });
  return { user, password };
}

export function makeAdmin(
  orm: FactoryOrm,
  overrides: Omit<UserOverrides, 'role'> = {},
): Promise<{ user: UserRow; password: string }> {
  return makeUser(orm, { ...overrides, role: 'admin' });
}

/** The fixed base32 TOTP secret `makeUserWithMfa` enables, so a test can compute valid codes. */
export const KNOWN_MFA_SECRET = 'JBSWY3DPEHPK3PXP';

/** A user with MFA already on, written directly so no rate-limited endpoint is involved. */
export async function makeUserWithMfa(
  orm: FactoryOrm,
  overrides: UserOverrides = {},
): Promise<{ user: UserRow; password: string; totpSecret: string }> {
  const { user, password } = await makeUser(orm, overrides);
  await updateRows(orm, Users, { id: user.id }, { mfa_enabled: 1, mfa_secret: encryptMfaSecret(KNOWN_MFA_SECRET) });
  return { user: await readUser(orm, user.id), password, totpSecret: KNOWN_MFA_SECRET };
}

/** The user row as it is now; fails the test when it is gone. */
export async function readUser(orm: FactoryOrm, id: number): Promise<UserRow> {
  const row = await findRow(orm, Users, { id });
  if (!row) throw new Error(`readUser: no user ${id}`);
  return row;
}

/** Immich credentials, with the API key encrypted the way the settings route stores it. */
export async function setImmichCredentials(
  orm: FactoryOrm,
  userId: number,
  url: string,
  apiKey: string,
): Promise<void> {
  await updateRows(orm, Users, { id: userId }, { immich_url: url, immich_api_key: encrypt_api_key(apiKey) });
}

/** Synology credentials, with the password encrypted the way the settings route stores it. */
export async function setSynologyCredentials(
  orm: FactoryOrm,
  userId: number,
  url: string,
  username: string,
  password: string,
): Promise<void> {
  await updateRows(
    orm,
    Users,
    { id: userId },
    { synology_url: url, synology_username: username, synology_password: encrypt_api_key(password) },
  );
}
