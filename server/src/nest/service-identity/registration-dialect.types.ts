/**
 * The shape of a registration dialect: how one release of TREK turns a
 * challenge of the issuer into a proof of work and a registration request.
 *
 * Each release registers in a dialect of its own, written by the issuer and
 * committed as registration-dialect.ts with the version bump. This file is the
 * stable side of that contract: the generated module imports these types, and
 * the key service only ever talks to a dialect through them. Renewing a key
 * never goes through a dialect.
 */
import type { ServiceChallenge } from '@trek/shared';

/** What a dialect gets to work with for one registration. */
export interface DialectInputs {
  challenge: ServiceChallenge;
  /** The running version, at most 32 characters. */
  version: string;
  /** 16 random bytes, fresh for every registration and never stored. */
  random: Buffer;
  /** Unix seconds on the issuer's clock. */
  nowSeconds: number;
}

/** What scrypt runs over for one nonce. */
export interface ProofInput {
  password: Buffer;
  salt: Buffer;
}

/** The registration as it goes out: the JSON body and the extra X-TREK-* headers. */
export interface RegistrationRequest {
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

/** One registration in progress. A nonce runs from 0 to 2^40. */
export interface DialectAttempt {
  work(nonce: number): ProofInput;
  request(nonce: number): RegistrationRequest;
}

export interface RegistrationDialect {
  /** '0' for the original registration, otherwise the issuer's 12-character id. */
  id: string;
  /** The release the issuer wrote the dialect for. */
  releasedFor: string;
  /** YYYY-MM-DD; the issuer accepts a dialect for new registrations for 180 days from then. */
  createdAt: string;
  challengePath: string;
  registerPath: string;
  begin(inputs: DialectInputs): DialectAttempt;
}

/**
 * Fixed inputs and what the dialect must make of them, as the issuer computed
 * it. The password, the salt and the request are compared by their SHA-256
 * (the request as JSON.stringify({ body, headers })); scrypt runs with the
 * challenge's N=16, r=1, p=1 and 32 bytes of output.
 */
export interface DialectSelfCheck {
  challenge: ServiceChallenge;
  version: string;
  /** Hex. */
  random: string;
  nowSeconds: number;
  nonce: number;
  inputSha256: string;
  saltSha256: string;
  /** Hex. */
  scrypt: string;
  requestSha256: string;
}
