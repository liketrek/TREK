import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../tests/helpers/render';
import { MapLoadStatusProvider } from './MapLoadStatus';
import { useMapLoadStatus } from './useMapLoadStatus';

function StateControls() {
  const report = useMapLoadStatus();
  return (
    <>
      <button type="button" onClick={() => report?.('ready')}>
        report ready
      </button>
      <button type="button" onClick={() => report?.('failed')}>
        report failed
      </button>
    </>
  );
}

describe('MapLoadStatusProvider', () => {
  it('FE-COMP-MAPLOAD-001: shows loading, clears on ready, and offers retry on failure', () => {
    const onRetry = vi.fn();
    render(
      <MapLoadStatusProvider onRetry={onRetry}>
        <StateControls />
      </MapLoadStatusProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'report ready' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'report failed' }));
    const alert = screen.getByRole('alert');
    fireEvent.click(within(alert).getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
