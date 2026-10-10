import { InviteTokens } from '../../../src/db/entities/InviteTokens.entity';
import { McpTokens } from '../../../src/db/entities/McpTokens.entity';
import { OauthClients } from '../../../src/db/entities/OauthClients.entity';
import { nextSeq, type FactoryOrm } from './context';
import { createRow, findRow, insertRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

import { createHash, randomBytes } from 'node:crypto';

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

/**
 * An MCP (or API) token for the user. Only its SHA-256 is stored, as the
 * tokens service stores it; the raw token comes back so the test can send it.
 */
export async function makeMcpToken(
  orm: FactoryOrm,
  userId: number,
  overrides: EntityData<McpTokens> & { rawToken?: string } = {},
): Promise<{ token: EntityDTO<McpTokens>; rawToken: string }> {
  const { rawToken: given, ...columns } = overrides;
  const rawToken = given ?? `trek_test_${nextSeq('mcp-token')}_${randomBytes(8).toString('hex')}`;
  const token = await createRow(orm, McpTokens, {
    user: userId,
    name: 'Test Token',
    token_hash: sha256(rawToken),
    token_prefix: rawToken.slice(0, 12),
    ...columns,
  });
  return { token, rawToken };
}

/**
 * An OAuth client registered by the user (or by nobody, for `null`),
 * confidential unless told otherwise. Only the secret's SHA-256 is stored;
 * the raw secret comes back.
 */
export async function makeOauthClient(
  orm: FactoryOrm,
  userId: number | null,
  overrides: Omit<EntityData<OauthClients>, 'id'> & { id?: string; secret?: string } = {},
): Promise<{ client: EntityDTO<OauthClients>; secret: string }> {
  const { secret: given, id: givenId, ...columns } = overrides;
  const n = nextSeq('oauth-client');
  const secret = given ?? `test-secret-${n}-${randomBytes(8).toString('hex')}`;
  const id = givenId ?? `test-oauth-client-${n}`;
  await insertRow(orm, OauthClients, {
    id,
    user: userId,
    name: `Test Client ${n}`,
    client_id: `client-${n}`,
    client_secret_hash: sha256(secret),
    redirect_uris: JSON.stringify(['https://client.example.test/callback']),
    allowed_scopes: JSON.stringify(['trips:read']),
    ...columns,
  });
  const client = await findRow(orm, OauthClients, { id });
  if (!client) throw new Error(`makeOauthClient: no client ${id} after its insert`);
  return { client, secret };
}

/** A one-use registration invite created by `createdBy`. */
export function makeInviteToken(
  orm: FactoryOrm,
  createdBy: number,
  overrides: EntityData<InviteTokens> = {},
): Promise<EntityDTO<InviteTokens>> {
  return createRow(orm, InviteTokens, {
    token: `test-invite-${nextSeq('invite-token')}`,
    max_uses: 1,
    used_count: 0,
    createdByRef: createdBy,
    ...overrides,
  });
}
