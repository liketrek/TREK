import type { CSSProperties } from 'react';

/** The look of the time picker's small chevron and clear buttons. */
export const spinnerButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 2,
  color: 'var(--text-faint)',
  display: 'flex',
  borderRadius: 4,
  transition: 'color 0.15s',
};
