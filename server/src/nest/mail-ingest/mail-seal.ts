import { decrypt_api_key, encrypt_api_key } from '../common/crypto/apiKeyCrypto';

/**
 * The stored form of a forwarded mail: encrypted the way API keys are. A mail
 * is bytes; latin1 maps each byte to one character and back, so nothing is
 * lost on the way through the text column.
 */
export function sealMail(raw: Buffer): string {
  return encrypt_api_key(raw.toString('latin1'));
}

/** The mail a sealed text holds; null for one that does not open (another key, a broken row). */
export function openMail(sealed: string | null): Buffer | null {
  if (!sealed) return null;
  const text = decrypt_api_key(sealed);
  return text === null ? null : Buffer.from(text, 'latin1');
}
