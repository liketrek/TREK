/**
 * The password policy, one copy for the server that enforces it and the forms
 * that check it while the user types (#1200). A rule changed here changes in
 * both places at once; a hand-kept copy in the client would drift.
 */

export const PASSWORD_MIN_LENGTH = 8;

const COMMON_PASSWORDS = new Set([
  'password',
  '12345678',
  '123456789',
  '1234567890',
  'password1',
  'qwerty123',
  'iloveyou',
  'admin123',
  'letmein12',
  'welcome1',
  'monkey123',
  'dragon12',
  'master12',
  'qwerty12',
  'abc12345',
  'trustno1',
  'baseball',
  'football',
  'shadow12',
  'michael1',
  'jennifer',
  'superman',
  'abcdefgh',
  'abcd1234',
  'password123',
  'admin1234',
  'changeme',
  'welcome123',
  'passw0rd',
  'p@ssword',
]);

/** The rules a form lists under a new password, each one met or not. */
export const PASSWORD_RULES = ['length', 'upper', 'lower', 'digit', 'special'] as const;
export type PasswordRule = (typeof PASSWORD_RULES)[number];

export function passwordRuleStates(password: string): Record<PasswordRule, boolean> {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

/** Why a password is refused, as a code a form can translate; null when it passes. */
export type PasswordProblem = 'tooShort' | 'repetitive' | 'common' | 'weak';

export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'tooShort';
  if (/^(.)\1+$/.test(password)) return 'repetitive';
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 'common';
  const rules = passwordRuleStates(password);
  if (!rules.upper || !rules.lower || !rules.digit || !rules.special) return 'weak';
  return null;
}

const SERVER_REASONS: Record<PasswordProblem, string> = {
  tooShort: 'Password must be at least 8 characters',
  repetitive: 'Password is too repetitive',
  common: 'Password is too common. Please choose a unique password.',
  weak: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
};

/** The server's answer: the same checks, with the English reasons the API has always sent. */
export function validatePassword(password: string): { ok: boolean; reason?: string } {
  const problem = passwordProblem(password);
  return problem ? { ok: false, reason: SERVER_REASONS[problem] } : { ok: true };
}
