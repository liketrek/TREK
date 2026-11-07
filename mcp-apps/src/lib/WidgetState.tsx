import { Fragment, type ReactNode } from 'react';
import type { TrekAppState, ToolResultState } from './useTrekApp';

/** What every widget shows before its result arrives or when the host failed, and its content after. */
export function WidgetState({
  state,
  children,
}: {
  state: Pick<TrekAppState, 'error' | 'result' | 't'>;
  children: (result: ToolResultState) => ReactNode;
}) {
  if (state.error) return <p className="trek-muted trek-state">{state.t('mcpApps.error')}</p>;
  if (!state.result) return <p className="trek-muted trek-state">{state.t('mcpApps.loading')}</p>;
  return <Fragment key={state.result.version ?? 0}>{children(state.result)}</Fragment>;
}

/** The link back into TREK a widget heading offers when the result carried an address. */
export interface HeaderLink {
  href: string | null;
  label: string;
  onOpen: (url: string) => void;
}

/**
 * A widget's heading: its title (with the id the section's `aria-labelledby`
 * names), a subtitle, and on the end either the link back into TREK or the
 * widget's own action.
 */
export function WidgetHeader({
  id,
  title,
  subtitle,
  link,
  action,
}: {
  id: string;
  title: string;
  subtitle?: ReactNode;
  link?: HeaderLink;
  action?: ReactNode;
}) {
  const href = link?.href;
  return (
    <header className="trek-header">
      <div className="trek-header__text">
        <h1 id={id} className="trek-header__title">
          {title}
        </h1>
        {subtitle ? <p className="trek-muted trek-header__subtitle">{subtitle}</p> : null}
      </div>
      {link && href ? (
        <button type="button" className="trek-button trek-button--primary" onClick={() => link.onOpen(href)}>
          {link.label}
        </button>
      ) : (
        action
      )}
    </header>
  );
}

/** A row of mutually exclusive options as pressed buttons: the budget's two views, the packing list's bags. */
export function SegmentedButtons<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: ReadonlyArray<readonly [T, string]>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={className}>
      {options.map(([option, text]) => (
        <button
          key={String(option)}
          type="button"
          aria-pressed={value === option}
          className="trek-button trek-hit"
          onClick={() => onChange(option)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
