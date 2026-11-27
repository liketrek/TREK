import type React from 'react';

/**
 * The one-time code field, for this step and the app's sign-in screen alike.
 * Text, not numeric: backup codes carry letters. The hints are set here rather
 * than left to native/keyboardFields.ts, because autoFocus gives the field
 * focus before any touch could prepare it.
 */
export function mfaCodeInputProps(
  code: string,
  onCode: (code: string) => void,
  placeholder: string
): React.InputHTMLAttributes<HTMLInputElement> {
  return {
    type: 'text',
    id: 'totp',
    name: 'totp',
    inputMode: 'text',
    autoComplete: 'one-time-code',
    autoCapitalize: 'characters',
    autoCorrect: 'off',
    spellCheck: false,
    enterKeyHint: 'go',
    value: code,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onCode(e.target.value.toUpperCase().slice(0, 24)),
    placeholder,
    required: true,
    autoFocus: true,
  };
}
