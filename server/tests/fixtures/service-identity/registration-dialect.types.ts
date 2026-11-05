/**
 * The example dialect beside this file imports its types from next to itself
 * the way a real dialect does in src/nest/service-identity/, so the release
 * check reads it as it reads one. This points that import at the real types,
 * so the example is typechecked and linted against them.
 */
export type {
  DialectSelfCheck,
  RegistrationDialect,
} from '../../../src/nest/service-identity/registration-dialect.types';
