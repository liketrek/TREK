import { KeyRound } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';

interface MfaCodeStepProps {
  /** The account being signed in, kept in the form for password managers. */
  email: string;
  code: string;
  onCode: (code: string) => void;
  inputStyle: React.CSSProperties;
  onBack: () => void;
}

/** The login's second step: the one-time or backup code, and the way back. */
export default function MfaCodeStep({ email, code, onCode, inputStyle, onBack }: MfaCodeStepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
          fontWeight: 600,
          color: '#374151',
          marginBottom: 6,
        }}
      >
        {t('login.mfaCodeLabel')}
      </label>
      {/* The account the code belongs to, for password managers: they match a
          one-time code to a saved login through the username in the same form,
          and the email field is gone in this step. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <div style={{ position: 'relative' }}>
        <KeyRound
          size={15}
          className="text-[#9ca3af]"
          style={{
            position: 'absolute',
            insetInlineStart: 13,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          id="totp"
          name="totp"
          // Text, not numeric: backup codes carry letters. The hints are set here
          // rather than left to native/keyboardFields.ts, because autoFocus gives
          // the field focus before any touch could prepare it.
          inputMode="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCode(e.target.value.toUpperCase().slice(0, 24))}
          placeholder={t('login.mfaPlaceholder')}
          required
          autoFocus
          style={inputStyle}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#111827')}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#e5e7eb')}
        />
      </div>
      <p style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: '#9ca3af', marginTop: 8 }}>
        {t('login.mfaHint')}
      </p>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginTop: 8,
          background: 'none',
          border: 'none',
          color: '#6b7280',
          fontSize: 'calc(13px * var(--fs-scale-body, 1))',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        {t('login.mfaBack')}
      </button>
    </div>
  );
}
