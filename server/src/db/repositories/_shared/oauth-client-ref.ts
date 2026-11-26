import type { OauthClients } from '../../entities/OauthClients.entity';
import type { Ref } from '@mikro-orm/core';

/**
 * The value an `oauth_tokens` or `oauth_consents` row writes for its `client`
 * relation, from the client's public `client_id`.
 *
 * That relation points at `oauth_clients.client_id`, the unique natural key,
 * not at the primary key `id` (`referencedColumnNames('client_id')` in both
 * entities). Given a bare string, MikroORM reads it as the target's primary key
 * and refuses the write, because it cannot know the `client_id` of that row
 * without loading it. Given the referenced property itself, it writes that
 * value to the column as it is.
 *
 * The typings only know a relation as an entity, a reference or a primary key,
 * so the plain object is handed over as the reference it stands for.
 */
export function oauthClientRef(clientId: string): Ref<OauthClients> {
  const referenced: Pick<OauthClients, 'client_id'> = { client_id: clientId };
  return referenced as unknown as Ref<OauthClients>;
}
