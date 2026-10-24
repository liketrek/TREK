import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import { SharedPlaceDetails } from './SharedPlaceDetails';

/** FE-PAGE-SHARED-PLACE-001: a stop's description and notes on a shared trip, read as the planner shows them (#2692). */

describe('SharedPlaceDetails', () => {
  it('FE-PAGE-SHARED-PLACE-001: renders markdown in the description and notes, and keeps raw HTML as text', () => {
    render(
      <SharedPlaceDetails
        place={{
          name: 'Market',
          address: 'Market Square 1',
          description: [
            '## Opening',
            '',
            '| Day | Hours |',
            '| --- | --- |',
            '| Sat | 8 to 14 |',
            '',
            '<img src=x onerror=alert(1)>',
          ].join('\n'),
          notes: ['- fruit', '- bread'].join('\n'),
        }}
        assignmentNotes="**Bring** cash"
      />
    );
    expect(screen.getByRole('heading', { name: 'Opening' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '8 to 14' })).toBeInTheDocument();
    expect(screen.getByText('Bring').tagName).toBe('STRONG');
    expect(screen.getByText('fruit').tagName).toBe('LI');
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(screen.queryByText('## Opening')).toBeNull();
  });
});
