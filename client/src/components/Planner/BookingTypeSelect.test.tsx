// FE-PLANNER-TYPESELECT-001 to FE-PLANNER-TYPESELECT-003
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { Hotel, Ticket, Utensils } from 'lucide-react';
import { BookingTypeSelect, type BookingTypeOption } from './BookingTypeSelect';

const OPTIONS: readonly BookingTypeOption[] = [
  { value: 'hotel', labelKey: 'reservations.type.hotel', Icon: Hotel },
  { value: 'restaurant', labelKey: 'reservations.type.restaurant', Icon: Utensils },
  { value: 'event', labelKey: 'reservations.type.event', Icon: Ticket },
];

describe('BookingTypeSelect', () => {
  it('FE-PLANNER-TYPESELECT-001: the field shows the current type, translated and with its icon', () => {
    render(<BookingTypeSelect options={OPTIONS} value="restaurant" onChange={vi.fn()} />);
    const field = screen.getByRole('button', { name: 'Restaurant' });
    expect(field.querySelector('svg.lucide-utensils')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Accommodation' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-TYPESELECT-002: every type is offered with its own icon once the field is opened', async () => {
    const user = userEvent.setup();
    render(<BookingTypeSelect options={OPTIONS} value="hotel" onChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Accommodation' }));
    expect(screen.getByRole('button', { name: 'Restaurant' }).querySelector('svg.lucide-utensils')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Event' }).querySelector('svg.lucide-ticket')).not.toBeNull();
    // The trigger and the option of the current type both read "Accommodation".
    expect(screen.getAllByRole('button', { name: 'Accommodation' })).toHaveLength(2);
  });

  it('FE-PLANNER-TYPESELECT-003: picking a type hands its value on as a string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BookingTypeSelect options={OPTIONS} value="hotel" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Accommodation' }));
    await user.click(screen.getByRole('button', { name: 'Event' }));
    expect(onChange).toHaveBeenCalledWith('event');
    // The menu closes after the pick.
    expect(screen.queryByRole('button', { name: 'Restaurant' })).not.toBeInTheDocument();
  });
});
