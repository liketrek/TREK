import { ALL_SCOPES, scopeGroup } from '../oauth/scopes';
import en from './en/oauth';

import { describe, expect, it } from 'vitest';

/**
 * The consent screen and the client presets build the keys of a scope from
 * the catalogue (client/src/api/oauthScopes.ts), so a scope added to
 * `oauth/scopes.ts` needs its words here first; the parity gate then carries
 * them to every locale.
 */
describe('the OAuth scope words', () => {
  it.each([...ALL_SCOPES])('%s has a label, a description and a group name in en', (scope) => {
    expect(en[`oauth.scope.${scope}.label`]).toBeTruthy();
    expect(en[`oauth.scope.${scope}.description`]).toBeTruthy();
    expect(en[`oauth.scope.group.${scopeGroup(scope)}`]).toBeTruthy();
  });
});
