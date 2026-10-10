/**
 * UsersRepository had grown to 84 methods, a fifth of them for the third-party
 * connections a user keeps on their row. Those now live in their own
 * repositories on the same table (UserImmich/UserSynology/UserAirtrail). This
 * pins the account repository's size so a new connection's statements land in
 * a repository of their own, and pins which columns each connection repository
 * is about, so a statement on another column does not drift into it.
 */
import { UserAirtrailRepository } from '../../../src/db/repositories/UserAirtrail.repository';
import { UserImmichRepository } from '../../../src/db/repositories/UserImmich.repository';
import { UserSynologyRepository } from '../../../src/db/repositories/UserSynology.repository';
import { UsersRepository } from '../../../src/db/repositories/Users.repository';

import { describe, expect, it } from 'vitest';

const ownMethods = (cls: { prototype: object }) =>
  Object.getOwnPropertyNames(cls.prototype)
    .filter((name) => name !== 'constructor')
    .sort();

describe('the users repositories', () => {
  it('USERSHAPE-001: UsersRepository holds no more methods than it does today', () => {
    // Lower this when a method leaves; a new integration gets its own repository.
    expect(ownMethods(UsersRepository).length).toBeLessThanOrEqual(66);
  });

  it('USERSHAPE-002: no connection statement is left on UsersRepository', () => {
    expect(ownMethods(UsersRepository).filter((name) => /immich|synology|airtrail/i.test(name))).toEqual([]);
  });

  it('USERSHAPE-003: each connection repository holds its own statements', () => {
    expect(ownMethods(UserImmichRepository)).toEqual([
      'clearImmichSettings',
      'getImmichAutoUpload',
      'getImmichConnectionPrefs',
      'getImmichCredentials',
      'setImmichAutoUpload',
      'setImmichSettings',
    ]);
    expect(ownMethods(UserSynologyRepository)).toEqual([
      'clearSynologySID',
      'clearSynologySession',
      'getSynologyFields',
      'getSynologyUsername',
      'setSynologyDid',
      'setSynologySettings',
      'setSynologySid',
    ]);
    expect(ownMethods(UserAirtrailRepository)).toEqual([
      'clearAirtrailApiKey',
      'getAirtrailConnRow',
      'getAirtrailWriteEnabled',
      'setAirtrailSettings',
      'setAirtrailSettingsWithKey',
    ]);
  });
});
