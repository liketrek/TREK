import React from 'react';

interface SpinnerProps {
  /**
   * Tailwind classes controlling size + colours of the ring. Callers keep full
   * control so adopting the component never changes a spinner's appearance.
   * Defaults to the app's most common page-loader ring.
   */
  className?: string;
}

/** The bare spinning ring used throughout the app (`rounded-full animate-spin`). */
export function Spinner({
  className = 'w-6 h-6 border-2 border-zinc-300 border-t-zinc-900',
}: SpinnerProps): React.ReactElement {
  return <div className={`${className} animate-spin rounded-full`} />;
}

interface PageSpinnerProps extends SpinnerProps {
  /** Wrapper classes for the centring container. */
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
}

/**
 * A full-area centred loading spinner — the repeated "flex items-center
 * justify-center" loader that page loading-guards render while data resolves.
 */
export function PageSpinner({
  className,
  wrapperClassName = 'flex items-center justify-center',
  wrapperStyle,
}: PageSpinnerProps): React.ReactElement {
  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      <Spinner className={className} />
    </div>
  );
}
