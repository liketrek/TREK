/**
 * For a field that holds somebody else's details: a place's e-mail and phone,
 * the account an admin is creating. Password managers read such a field as a
 * login and offer, or simply fill in, the signed-in user's own credentials.
 * `autocomplete="off"` alone does not stop them (1Password ignores it on
 * purpose), so each one gets its own opt-out. Never use it on a login or on the
 * user's own account fields, where autofill is wanted.
 */
export const NO_AUTOFILL = {
  autoComplete: 'off',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
} as const;
