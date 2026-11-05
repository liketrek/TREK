import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TranslationProvider } from '../../i18n/TranslationContext';
import StayPinStatus from './StayPinStatus';
import type { StayPin } from './useStayPin';

function show(pin: StayPin, onRetry = vi.fn()) {
  render(createElement(TranslationProvider, null, createElement(StayPinStatus, { pin, onRetry })));
  return onRetry;
}

describe('StayPinStatus', () => {
  it('FE-STAY-PIN-STATUS-001: shows nothing before a lookup', () => {
    const { container } = render(
      createElement(
        TranslationProvider,
        null,
        createElement(StayPinStatus, { pin: { status: 'idle' }, onRetry: vi.fn() })
      )
    );
    expect(container.textContent).toBe('');
  });

  it('FE-STAY-PIN-STATUS-001b: a stay already linked to a place of the trip shows nothing', () => {
    const { container } = render(
      createElement(
        TranslationProvider,
        null,
        createElement(StayPinStatus, { pin: { status: 'missing' }, hidden: true, onRetry: vi.fn() })
      )
    );
    expect(container.textContent).toBe('');
  });

  it('FE-STAY-PIN-STATUS-002: says it is looking, then where it found the stay', () => {
    show({ status: 'searching' });
    expect(screen.getByRole('status')).toHaveTextContent('Looking for it on the map');
  });

  it('FE-STAY-PIN-STATUS-003: a found stay names the match, so a wrong one is plain', () => {
    show({ status: 'found', match: { lat: 1, lng: 2, label: 'Hotel Gracery Shinjuku, Tokyo' } });
    expect(screen.getByRole('status')).toHaveTextContent('On the map');
    expect(screen.getByText('Hotel Gracery Shinjuku, Tokyo')).toBeInTheDocument();
  });

  it('FE-STAY-PIN-STATUS-004: a missing stay says so and offers to search again', () => {
    const onRetry = show({ status: 'missing' });
    expect(screen.getByText('Not on the map yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /search again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
