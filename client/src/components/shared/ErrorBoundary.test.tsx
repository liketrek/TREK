import React from 'react';
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import ErrorBoundary, { RootErrorFallback } from './ErrorBoundary';

// React logs every caught error itself; without this each of these tests prints a
// full component stack and buries the real output.
let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  sessionStorage.clear();
});
afterEach(() => {
  consoleError.mockRestore();
});

function Boom({ message = 'kaboom' }: { message?: string }): React.ReactElement {
  throw new Error(message);
}

const CHUNK_MESSAGE = 'Failed to fetch dynamically imported module: /assets/DashboardPage-abc123.js';

describe('ErrorBoundary', () => {
  it('FE-COMP-ERRBOUND-001: renders its children while nothing throws', () => {
    render(
      <ErrorBoundary boundaryId="test">
        <p>all good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('FE-COMP-ERRBOUND-002: swaps in the fallback when a child throws', () => {
    render(
      <ErrorBoundary boundaryId="test">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // The message is surfaced on purpose — self-hosted users file their own issues.
    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-003: logs the boundaryId so a report says which one tripped', () => {
    render(
      <ErrorBoundary boundaryId="planner-tabs">
        <Boom />
      </ErrorBoundary>,
    );
    expect(consoleError).toHaveBeenCalledWith(
      '[ErrorBoundary:planner-tabs]',
      expect.any(Error),
      expect.anything(),
    );
  });

  it('FE-COMP-ERRBOUND-004: a custom node fallback replaces the default panel', () => {
    render(
      <ErrorBoundary boundaryId="test" fallback={<p>quiet fallback</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('quiet fallback')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('FE-COMP-ERRBOUND-005: fallback={null} hides a broken widget without a trace', () => {
    const { container } = render(
      <ErrorBoundary boundaryId="widget:test" fallback={null}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-ERRBOUND-006: a function fallback receives the error and the reset handle', () => {
    render(
      <ErrorBoundary
        boundaryId="test"
        fallback={s => <p>{s.error instanceof Error ? s.error.message : 'none'} / {String(s.isChunkError)}</p>}
      >
        <Boom message="detail" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('detail / false')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-007: retry clears the error and re-renders the children', () => {
    function Flaky({ shouldThrow }: { shouldThrow: boolean }) {
      if (shouldThrow) throw new Error('transient');
      return <p>recovered</p>;
    }
    function Harness() {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary boundaryId="test" onReset={() => setShouldThrow(false)}>
          <Flaky shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-008: a changed resetKey clears the error on its own', () => {
    function Harness({ id, throws }: { id: number; throws: boolean }) {
      return (
        <ErrorBoundary boundaryId="test" resetKeys={[id]}>
          {throws ? <Boom /> : <p>panel {id}</p>}
        </ErrorBoundary>
      );
    }
    const { rerender } = render(<Harness id={1} throws />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Switching to another trip/tab must not carry the previous failure over.
    rerender(<Harness id={2} throws={false} />);
    expect(screen.getByText('panel 2')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-009: an unchanged resetKey leaves the error standing', () => {
    function Harness({ id }: { id: number }) {
      return (
        <ErrorBoundary boundaryId="test" resetKeys={[id]}>
          <Boom />
        </ErrorBoundary>
      );
    }
    const { rerender } = render(<Harness id={1} />);
    rerender(<Harness id={1} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-010: a dead chunk offers a reload instead of a retry', () => {
    render(
      <ErrorBoundary boundaryId="route" level="route">
        <Boom message={CHUNK_MESSAGE} />
      </ErrorBoundary>,
    );
    // React.lazy caches the rejection, so a retry button would be a button that
    // does nothing — only a reload can pick up the new index.
    expect(screen.queryByText('Try again')).toBeNull();
    expect(screen.getByText('Reload page')).toBeInTheDocument();
    expect(screen.getByText('A new version is available')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-011: a chunk failure reloads once, then stops', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });

    render(
      <ErrorBoundary boundaryId="a">
        <Boom message={CHUNK_MESSAGE} />
      </ErrorBoundary>,
    );
    expect(reload).toHaveBeenCalledTimes(1);

    // Second failure in the same session: the marker is set, so no reload loop.
    render(
      <ErrorBoundary boundaryId="b">
        <Boom message={CHUNK_MESSAGE} />
      </ErrorBoundary>,
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-ERRBOUND-012: a labelled boundary names what failed', () => {
    render(
      <ErrorBoundary boundaryId="plugin-frame" label="Koffi & Friends">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Koffi & Friends')).toBeInTheDocument();
    expect(screen.getByText('This plugin could not be shown')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-013: a panel fallback says the rest of the page still works', () => {
    render(
      <ErrorBoundary boundaryId="panel" level="panel">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('This section could not be shown')).toBeInTheDocument();
    expect(screen.getByText('The rest of the page still works.')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-014: the mobile variant uses the mobile tokens', () => {
    render(
      <ErrorBoundary boundaryId="route" level="route" variant="mobile">
        <Boom />
      </ErrorBoundary>,
    );
    // --m-* only resolves inside MobileShell's .m-root; the desktop classes would
    // render an invisible card there.
    expect(screen.getByRole('alert').className).toContain('bg-m-card');
  });
});

describe('RootErrorFallback', () => {
  it('FE-COMP-ERRBOUND-015: stays untranslated because it renders above the provider', () => {
    render(<RootErrorFallback error={new Error('boot failed')} reset={() => {}} isChunkError={false} />);
    // If it called t() and the provider was the thing that broke, the user would
    // be reading "common.errorTitle".
    expect(screen.getByText('TREK could not start')).toBeInTheDocument();
    expect(screen.getByText('boot failed')).toBeInTheDocument();
  });

  it('FE-COMP-ERRBOUND-016: names a stale chunk as an update rather than a crash', () => {
    render(<RootErrorFallback error={new Error(CHUNK_MESSAGE)} reset={() => {}} isChunkError />);
    expect(screen.getByText('A new version is available')).toBeInTheDocument();
  });
});
