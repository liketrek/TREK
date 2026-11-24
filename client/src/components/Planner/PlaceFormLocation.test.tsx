import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { PlaceFormLocation } from './PlaceFormLocation';

import { describe, expect, it, vi } from 'vitest';

const HINT =
  'This address has no coordinates yet, so the place will not show on the map. Pick it from the search above or enter latitude and longitude.';

function renderLocation(form: { address: string; lat: string; lng: string }, warnWithoutCoordinates = true) {
  const onChange = vi.fn();
  render(
    <PlaceFormLocation fieldId="pf" form={form} onChange={onChange} warnWithoutCoordinates={warnWithoutCoordinates} />
  );
  return onChange;
}

describe('PlaceFormLocation', () => {
  it('FE-PLANNER-PFLOC-001: an address typed without coordinates says the place will not be on the map (#2837)', () => {
    renderLocation({ address: 'Rue de Rivoli 1, Paris', lat: '', lng: '' });
    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  it('FE-PLANNER-PFLOC-002: no word with coordinates, without an address, or where the form explains it itself', () => {
    renderLocation({ address: 'Rue de Rivoli 1, Paris', lat: '48.86', lng: '2.35' });
    renderLocation({ address: '', lat: '', lng: '' });
    renderLocation({ address: 'Rue de Rivoli 1, Paris', lat: '', lng: '' }, false);
    expect(screen.queryByText(HINT)).toBeNull();
  });

  it('FE-PLANNER-PFLOC-003: the fields write through, and a pasted pair fills both coordinates', () => {
    const onChange = renderLocation({ address: '', lat: '', lng: '' });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Rue de Rivoli 1' } });
    expect(onChange).toHaveBeenCalledWith('address', 'Rue de Rivoli 1');

    fireEvent.paste(screen.getByLabelText('Latitude'), { clipboardData: { getData: () => '48.8566, 2.3522' } });
    expect(onChange).toHaveBeenCalledWith('lat', '48.8566');
    expect(onChange).toHaveBeenCalledWith('lng', '2.3522');
  });
});
