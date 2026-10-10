import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { spinnerButtonStyle } from './timeSpinnerStyle';

interface TimeSpinnerColumnProps {
  onUp: () => void;
  onDown: () => void;
  children: ReactNode;
  /** Extra style for the column, such as the gap before the AM/PM column. */
  style?: CSSProperties;
  /** Size and type of the value box between the chevrons. */
  valueStyle: CSSProperties;
}

/** One column of the time picker: a chevron up, the value, a chevron down. */
export function TimeSpinnerColumn({ onUp, onDown, children, style, valueStyle }: TimeSpinnerColumnProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, ...style }}>
      <SpinnerButton onClick={onUp}>
        <ChevronUp size={16} />
      </SpinnerButton>
      <div
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: 'var(--text-primary)',
          background: 'var(--bg-hover)',
          borderRadius: 8,
          ...valueStyle,
        }}
      >
        {children}
      </div>
      <SpinnerButton onClick={onDown}>
        <ChevronDown size={16} />
      </SpinnerButton>
    </div>
  );
}

function SpinnerButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={spinnerButtonStyle}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
    >
      {children}
    </button>
  );
}
