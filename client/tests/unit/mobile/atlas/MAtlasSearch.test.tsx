import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import MAtlasSearch from '../../../../src/mobile/screens/atlas/MAtlasSearch';

// FE-MOB-ATLAS-001 onwards

const options = [
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'JP', label: 'Japan' },
];

function renderSearch(overrides: Partial<React.ComponentProps<typeof MAtlasSearch>> = {}) {
  const props: React.ComponentProps<typeof MAtlasSearch> = {
    open: true,
    onClose: () => {},
    options,
    suggestions: [{ code: 'JP', label: 'Japan' }],
    isVisited: () => false,
    isOnBucketList: () => false,
    onSelect: () => {},
    ...overrides,
  };
  return render(<MAtlasSearch {...props} />);
}

describe('MAtlasSearch', () => {
  it('FE-MOB-ATLAS-001: shows suggestions while empty and filters countries as you type', async () => {
    renderSearch();

    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.queryByText('Germany')).not.toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Search a country...'), 'germ');

    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.queryByText('Japan')).not.toBeInTheDocument();
  });

  it('FE-MOB-ATLAS-002: tapping a result reports the country code for the fly-to', async () => {
    const onSelect = vi.fn();
    renderSearch({ onSelect });

    await userEvent.type(screen.getByPlaceholderText('Search a country...'), 'fran');
    await userEvent.click(screen.getByText('France'));

    expect(onSelect).toHaveBeenCalledWith('FR');
  });

  it('FE-MOB-ATLAS-003: renders nothing while closed', () => {
    renderSearch({ open: false });
    expect(screen.queryByPlaceholderText('Search a country...')).not.toBeInTheDocument();
  });
});
