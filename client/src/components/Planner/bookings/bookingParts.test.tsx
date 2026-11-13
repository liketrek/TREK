// FE-PLANNER-BKPARTS-001 to FE-PLANNER-BKPARTS-004
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildTripFile } from '../../../../tests/helpers/factories';
import { downloadFile, openFile } from '../../../utils/fileDownload';
import type { BookingFacts } from './bookingFacts';
import { FileRows, WhenFields } from './bookingParts';

vi.mock('../../../utils/fileDownload', () => ({
  openFile: vi.fn(() => Promise.resolve()),
  downloadFile: vi.fn(() => Promise.resolve()),
}));

function facts(day: BookingFacts['day'], time: string | null = '15:35 → 09:55'): BookingFacts {
  return {
    day,
    time,
    startTime: null,
    endTime: null,
    startDate: null,
    endDate: null,
    cells: [],
    endpoints: [],
    legCodes: [],
    place: null,
    accommodation: null,
    linked: null,
    url: null,
    isHotel: false,
  };
}

describe('WhenFields', () => {
  it('FE-PLANNER-BKPARTS-001: a long day title is cut, the date beside it never shrinks (#2590)', () => {
    render(
      <WhenFields
        facts={facts({
          label: 'Germany Departure Flight with a much longer custom title → Korea Arrival',
          date: 'Oct 21 → Oct 22',
          range: true,
        })}
      />
    );

    const title = screen.getByText('Germany Departure Flight with a much longer custom title → Korea Arrival');
    const date = screen.getByText('Oct 21 → Oct 22');
    expect(title).toHaveClass('truncate');
    expect(date).toHaveClass('flex-none');
    expect(title.contains(date)).toBe(false);
  });

  it('FE-PLANNER-BKPARTS-002: a day without a date prints its label alone', () => {
    render(<WhenFields facts={facts({ label: 'Day 3', date: null, range: false }, null)} />);
    expect(screen.getByText('Day 3')).toBeInTheDocument();
  });
});

describe('FileRows', () => {
  const file = buildTripFile({ id: 5, url: '/uploads/f/5', original_name: 'ticket.pdf' });

  it('FE-PLANNER-BKPARTS-003: the name opens the file, the icon downloads it, and neither reaches the card (#2585)', () => {
    vi.mocked(openFile).mockClear();
    vi.mocked(downloadFile).mockClear();
    const onCard = vi.fn();
    render(
      <div onClick={onCard}>
        <FileRows files={[file]} />
      </div>
    );

    const open = screen.getByRole('button', { name: 'ticket.pdf' });
    const download = screen.getByRole('button', { name: /: ticket\.pdf$/ });
    // Two sibling buttons, never one inside the other.
    expect(open.contains(download)).toBe(false);
    expect(download.contains(open)).toBe(false);

    fireEvent.click(open);
    expect(openFile).toHaveBeenCalledWith('/uploads/f/5', 'ticket.pdf');
    expect(downloadFile).not.toHaveBeenCalled();
    fireEvent.click(download);
    expect(downloadFile).toHaveBeenCalledWith('/uploads/f/5', 'ticket.pdf');
    expect(openFile).toHaveBeenCalledOnce();
    expect(onCard).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BKPARTS-004: no files render nothing', () => {
    const { container } = render(<FileRows files={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
