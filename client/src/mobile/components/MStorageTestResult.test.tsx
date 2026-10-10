// FE-COMP-MSTORETEST-001 to FE-COMP-MSTORETEST-004
import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import MStorageTestResult from './MStorageTestResult';

describe('MStorageTestResult', () => {
  it('FE-COMP-MSTORETEST-001: renders nothing before the first test', () => {
    const { container } = render(<MStorageTestResult result={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-MSTORETEST-002: shows the running note while a test is in flight', () => {
    render(<MStorageTestResult result="running" />);

    expect(screen.getByText('Testing…')).toHaveClass('mt-2', 'font-geist', 'text-m-muted');
  });

  it('FE-COMP-MSTORETEST-003: lists every target under a passed verdict', () => {
    render(<MStorageTestResult result={{ ok: true, targets: [{ name: 'off-box', ok: true }] }} />);

    expect(screen.getByText('Connection OK')).toHaveClass('font-bold', 'text-m-ink');
    expect(screen.getByText(/off-box/).textContent).toBe('✓ off-box');
  });

  it('FE-COMP-MSTORETEST-004: marks a failed target and appends its error', () => {
    render(
      <MStorageTestResult
        result={{
          ok: false,
          targets: [
            { name: 'primary', ok: true },
            { name: 'replica', ok: false, error: 'timeout' },
          ],
        }}
      />
    );

    expect(screen.getByText('Test failed')).toBeInTheDocument();
    expect(screen.getByText(/primary/).textContent).toBe('✓ primary');
    expect(screen.getByText(/replica/).textContent).toBe('✗ replica — timeout');
  });
});
