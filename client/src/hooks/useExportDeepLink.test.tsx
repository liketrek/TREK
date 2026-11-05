/**
 * FE-EXPORTLINK-001 to FE-EXPORTLINK-003: `?export=pdf` opens the trip's export
 * once, the way Safari lands after the iOS Home Screen app handed the PDF over.
 */
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { useExportDeepLink } from './useExportDeepLink';

function setup(entry: string) {
  const openExport = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
  );
  const { result, rerender } = renderHook(
    () => {
      useExportDeepLink(openExport);
      return useLocation();
    },
    { wrapper }
  );
  return { openExport, result, rerender };
}

describe('useExportDeepLink', () => {
  it('FE-EXPORTLINK-001: opens the export and drops the parameter, keeping the others', () => {
    const { openExport, result, rerender } = setup('/trips/7?tab=plan&export=pdf');
    expect(openExport).toHaveBeenCalledTimes(1);
    expect(result.current.pathname).toBe('/trips/7');
    expect(result.current.search).toBe('?tab=plan');

    rerender();
    expect(openExport).toHaveBeenCalledTimes(1);
  });

  it('FE-EXPORTLINK-002: leaves the trip alone without the parameter', () => {
    const { openExport, result } = setup('/trips/7?tab=plan');
    expect(openExport).not.toHaveBeenCalled();
    expect(result.current.search).toBe('?tab=plan');
  });

  it('FE-EXPORTLINK-003: ignores an export it does not know', () => {
    const { openExport, result } = setup('/trips/7?export=gpx');
    expect(openExport).not.toHaveBeenCalled();
    expect(result.current.search).toBe('?export=gpx');
  });
});
