// FE-MOB-PLCONTACT-001 to FE-MOB-PLCONTACT-003: phone, e-mail and opening hours on the phone.
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { PlContactFields } from './PlContactFields';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

function Harness({ onChange, start = '' }: { onChange: (field: string, value: string) => void; start?: string }) {
  const [state, setState] = useState({ phone: '', email: '', opening_hours: start });
  return (
    <PlContactFields
      phone={state.phone}
      email={state.email}
      openingHours={state.opening_hours}
      locale="en"
      t={t}
      onChange={(field, value) => {
        onChange(field, value);
        setState((s) => ({ ...s, [field]: value }));
      }}
    />
  );
}

describe('PlContactFields', () => {
  it('FE-MOB-PLCONTACT-001: phone and e-mail are fields of their own', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('places.formPhone'), { target: { value: '+1 555' } });
    expect(onChange).toHaveBeenLastCalledWith('phone', '+1 555');
    fireEvent.change(screen.getByLabelText('places.formEmail'), { target: { value: 'a@b.co' } });
    expect(onChange).toHaveBeenLastCalledWith('email', 'a@b.co');
    expect(screen.getByLabelText('places.formEmail')).toHaveAttribute('type', 'email');
  });

  it('FE-MOB-PLCONTACT-002: the week unfolds from one field, and a day opens around the clock or closes', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(screen.queryByRole('switch', { name: 'Monday: places.hoursAllDay' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'places.hoursAdd' }));

    fireEvent.click(screen.getByRole('switch', { name: 'Monday: places.hoursAllDay' }));
    expect(JSON.parse(onChange.mock.lastCall?.[1])[0]).toEqual({ closed: false, open: '00:00', close: '23:59' });
    expect(screen.getByRole('switch', { name: 'Monday: places.hoursAllDay' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('switch', { name: 'Tuesday: places.hoursClosed' }));
    expect(JSON.parse(onChange.mock.lastCall?.[1])[1]).toEqual({ closed: true });
    expect(screen.getByText('places.hoursClosed')).toBeInTheDocument();
  });

  it('FE-MOB-PLCONTACT-003: Monday goes to every day, and the week folds away again', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'places.hoursAdd' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Monday: places.hoursClosed' }));
    fireEvent.click(screen.getByRole('button', { name: 'places.hoursCopyFirst:Monday' }));
    expect(JSON.parse(onChange.mock.lastCall?.[1]).every((d: { closed: boolean }) => d.closed)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'places.hoursRemove' }));
    expect(onChange).toHaveBeenLastCalledWith('opening_hours', '');
    expect(screen.getByRole('button', { name: 'places.hoursAdd' })).toBeInTheDocument();
  });
});
