/** The issuer of installation keys: the Places host itself, so no new egress domain is needed. */
export const SERVICE_ISSUER_ORIGIN = 'https://places.liketrek.com';

/** The registration dialect this build speaks (registration-dialect.ts); tests hand in their own. */
export const REGISTRATION_DIALECT = Symbol('REGISTRATION_DIALECT');
