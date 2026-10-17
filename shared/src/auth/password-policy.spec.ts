import { passwordProblem, passwordRuleStates, validatePassword, PASSWORD_RULES } from './password-policy';

import { describe, expect, it } from 'vitest';

describe('password policy (#1200)', () => {
  it('names each rule a password meets', () => {
    expect(passwordRuleStates('')).toEqual({ length: false, upper: false, lower: false, digit: false, special: false });
    expect(passwordRuleStates('Abcdefg1!')).toEqual({
      length: true,
      upper: true,
      lower: true,
      digit: true,
      special: true,
    });
    expect(passwordRuleStates('abcdefgh')).toMatchObject({
      length: true,
      upper: false,
      lower: true,
      digit: false,
      special: false,
    });
    expect(PASSWORD_RULES).toEqual(['length', 'upper', 'lower', 'digit', 'special']);
  });

  it('reports the first problem in the order the server checks', () => {
    expect(passwordProblem('Ab1!')).toBe('tooShort');
    expect(passwordProblem('aaaaaaaaaa')).toBe('repetitive');
    expect(passwordProblem('Passw0rd')).toBe('common');
    expect(passwordProblem('abcdefgh1')).toBe('weak');
    expect(passwordProblem('Abcdefg1!')).toBeNull();
  });

  it('keeps the reasons the API has always answered with', () => {
    expect(validatePassword('Ab1!')).toEqual({ ok: false, reason: 'Password must be at least 8 characters' });
    expect(validatePassword('aaaaaaaaaa')).toEqual({ ok: false, reason: 'Password is too repetitive' });
    expect(validatePassword('changeme')).toEqual({
      ok: false,
      reason: 'Password is too common. Please choose a unique password.',
    });
    expect(validatePassword('abcdefgh1')).toEqual({
      ok: false,
      reason:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    });
    expect(validatePassword('Abcdefg1!')).toEqual({ ok: true });
  });
});
