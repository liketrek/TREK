import { MapPin, X } from 'lucide-react';
import type React from 'react';
import { useTranslation } from '../../i18n';

// The markup the planner's search fields share: the boxed input with its icon and
// clear button (AirportSelect, LocationSelect), the floating list (all three) and
// a map search answer as a row (LocationSelect, AddressInput).

interface SuggestionInputBoxProps {
  icon: React.ReactNode;
  query: string;
  placeholder: string;
  onType: (text: string) => void;
  onOpen: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Shown as the clear button while a value is picked. */
  onClear?: () => void;
}

export function SuggestionInputBox({
  icon,
  query,
  placeholder,
  onType,
  onOpen,
  onKeyDown,
  onClear,
}: SuggestionInputBoxProps) {
  return (
    <div
      className="bg-surface-tertiary"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid var(--border-primary)',
      }}
    >
      {icon}
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => onType(e.target.value)}
        // Opens its list on focus, so a dialog must not focus it by itself (#1302).
        data-no-autofocus
        onFocus={onOpen}
        onKeyDown={onKeyDown}
        className="bg-transparent text-content"
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          fontSize: 'calc(13px * var(--fs-scale-body, 1))',
        }}
      />
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="bg-transparent text-content-faint"
          style={{ border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}
          aria-label="Clear"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

interface SuggestionListProps {
  /** Shows the loading line while there are no rows yet. */
  loading: boolean;
  rowCount: number;
  children: React.ReactNode;
}

/** The floating list under the field. Rendered only while it is loading or has rows; the caller checks `open`. */
export function SuggestionList({ loading, rowCount, children }: SuggestionListProps) {
  const { t } = useTranslation();
  if (!loading && rowCount === 0) return null;
  return (
    <div
      className="bg-surface-card"
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        insetInline: 0,
        border: '1px solid var(--border-primary)',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        maxHeight: 260,
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      {loading && rowCount === 0 && (
        <div className="text-content-faint" style={{ padding: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
          {t('common.loading')}
        </div>
      )}
      {children}
    </div>
  );
}

interface SuggestionRowProps {
  active: boolean;
  onPick: () => void;
  onHover: () => void;
  /** How the row lines up its icon and text. */
  align: 'center' | 'flex-start';
  children: React.ReactNode;
}

export function SuggestionRow({ active, onPick, onHover, align, children }: SuggestionRowProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={onHover}
      className={`text-content ${active ? 'bg-surface-hover' : 'bg-transparent'}`}
      style={{
        display: 'flex',
        alignItems: align,
        gap: 8,
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'start',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

interface PlaceSuggestionProps {
  name?: string | null;
  address?: string | null;
}

/** A place as a row's content: a pin, its name, and its address when that says more. */
export function PlaceSuggestion({ name, address }: PlaceSuggestionProps) {
  return (
    <>
      <MapPin size={12} className="text-content-faint" style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'calc(13px * var(--fs-scale-body, 1))',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name || address}
        </div>
        {address && name && name !== address && (
          <div
            className="text-content-faint"
            style={{
              fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {address}
          </div>
        )}
      </span>
    </>
  );
}
