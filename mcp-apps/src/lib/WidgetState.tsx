import type { ReactNode } from 'react';
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
  return <>{children(state.result)}</>;
}

/** A widget's heading, with the link back into TREK when the result carried an address. */
export function WidgetHeader({
  title,
  subtitle,
  href,
  openLabel,
  onOpen,
}: {
  title: string;
  subtitle?: string | null;
  href: string | null;
  openLabel: string;
  onOpen: (url: string) => void;
}) {
  return (
    <header className="trek-header">
      <div className="trek-header__text">
        <h1 className="trek-header__title">{title}</h1>
        {subtitle ? <p className="trek-muted trek-header__subtitle">{subtitle}</p> : null}
      </div>
      {href ? (
        <button type="button" className="trek-button trek-button--primary" onClick={() => onOpen(href)}>
          {openLabel}
        </button>
      ) : null}
    </header>
  );
}
