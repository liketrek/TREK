import { useState } from 'react';
import { render, screen, fireEvent, act } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import CustomTimePicker from './CustomTimePicker';
import { useSettingsStore } from '../../store/settingsStore';
import { seedStore, resetAllStores } from '../../../tests/helpers/store';
import { buildSettings } from '../../../tests/helpers/factories';

describe('CustomTimePicker', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    resetAllStores();
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) });
  });

  it('FE-COMP-TIMEPICKER-001: renders without crashing', () => {
    render(<CustomTimePicker value="" onChange={onChange} />);
    expect(document.body).toBeTruthy();
  });

  it('FE-COMP-TIMEPICKER-002: shows value in text input in 24h format', () => {
    render(<CustomTimePicker value="14:30" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveProperty('value', '14:30');
  });

  it('FE-COMP-TIMEPICKER-003: shows value in 12h format', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) });
    render(<CustomTimePicker value="14:30" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveProperty('value', '2:30 PM');
  });

  it('FE-COMP-TIMEPICKER-004: shows raw value while focused', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) });
    render(<CustomTimePicker value="14:30" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.setup().click(input);
    expect(input).toHaveProperty('value', '14:30');
  });

  it('FE-COMP-TIMEPICKER-005: clicking clock icon opens dropdown', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="10:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    // Dropdown should show hour and minute display boxes with "10" and "00"
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('00')).toBeTruthy();
  });

  it('FE-COMP-TIMEPICKER-006: hour increment button increases hour', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="10:00" onChange={onChange} />);
    // Open dropdown
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    // The first empty button inside the dropdown is the hour up chevron
    const chevrons = screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');
    // chevrons[0] is the clock icon, chevrons after that are up/down for hour, up/down for minute
    await user.click(chevrons[1]); // hour up
    expect(onChange).toHaveBeenCalledWith('11:00');
  });

  it('FE-COMP-TIMEPICKER-007: hour decrement button decreases hour', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="10:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    const chevrons = screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');
    await user.click(chevrons[2]); // hour down
    expect(onChange).toHaveBeenCalledWith('09:00');
  });

  it('FE-COMP-TIMEPICKER-008: minute increment steps by 5', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="10:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    const chevrons = screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');
    await user.click(chevrons[3]); // minute up
    expect(onChange).toHaveBeenCalledWith('10:05');
  });

  it('FE-COMP-TIMEPICKER-009: minute increment wraps and carries hour', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="10:55" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    const chevrons = screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');
    await user.click(chevrons[3]); // minute up
    expect(onChange).toHaveBeenCalledWith('11:00');
  });

  it('FE-COMP-TIMEPICKER-010: hour wraps at 23→0', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="23:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    const chevrons = screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');
    await user.click(chevrons[1]); // hour up
    expect(onChange).toHaveBeenCalledWith('00:00');
  });

  it('FE-COMP-TIMEPICKER-011: clear button calls onChange with empty string', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="10:30" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    const clearBtn = screen.getByText('✕');
    await user.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('FE-COMP-TIMEPICKER-012: clear button absent when no value', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    expect(screen.queryByText('✕')).toBeNull();
  });

  it('FE-COMP-TIMEPICKER-013: AM/PM toggle shown in 12h mode', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) });
    const user = userEvent.setup();
    render(<CustomTimePicker value="14:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    expect(screen.getByText('PM')).toBeTruthy();
  });

  it('FE-COMP-TIMEPICKER-014: AM/PM toggle hidden in 24h mode', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="14:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    expect(screen.queryByText('AM')).toBeNull();
    expect(screen.queryByText('PM')).toBeNull();
  });

  it('FE-COMP-TIMEPICKER-015: AM/PM toggle switches hour', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) });
    const user = userEvent.setup();
    render(<CustomTimePicker value="14:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    // In 12h mode with value "14:00", there are AM/PM chevrons after hour and minute chevrons
    const chevrons = screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');
    // chevrons: [0]=clock, [1]=hour up, [2]=hour down, [3]=min up, [4]=min down, [5]=ampm up, [6]=ampm down
    await user.click(chevrons[5]); // AM/PM toggle
    expect(onChange).toHaveBeenCalledWith('02:00');
  });

  it('FE-COMP-TIMEPICKER-016: blur normalizes HH:MM input', () => {
    // "9:05" matches /^\d{1,2}:\d{2}$/ and normalizes the hour to zero-padded
    render(<CustomTimePicker value="9:05" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith('09:05');
  });

  it('FE-COMP-TIMEPICKER-017: blur normalizes 4-digit HHMM input', () => {
    render(<CustomTimePicker value="1430" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith('14:30');
  });

  it('FE-COMP-TIMEPICKER-018: blur normalizes bare hour', () => {
    render(<CustomTimePicker value="8" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith('08:00');
  });

  it('FE-COMP-TIMEPICKER-019: blur normalizes 12h string "5:30 PM"', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) });
    render(<CustomTimePicker value="5:30 PM" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith('17:30');
  });

  it('FE-COMP-TIMEPICKER-020: clicking outside dropdown closes it', async () => {
    const user = userEvent.setup();
    render(<CustomTimePicker value="10:00" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '');
    await user.click(clockBtn!);
    // Verify dropdown is open
    expect(screen.getByText('10')).toBeTruthy();
    // Click outside
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    await act(async () => {
      fireEvent.mouseDown(outsideEl);
    });
    document.body.removeChild(outsideEl);
    // Hour display should be gone (only visible in dropdown)
    const allText = Array.from(document.querySelectorAll('div')).map(d => d.textContent);
    // The "10" in the dropdown display box should no longer be rendered as a standalone element
    expect(screen.queryByText('✕')).toBeNull(); // clear button gone = dropdown closed
  });
});

// FE-W5TP-001 to FE-W5TP-024 — remaining branches: 12h display arms, null-hour
// stepping, the minute-down button, handleInput/handleBlur parse arms and the
// hover styling of the stepper buttons.
describe('CustomTimePicker branches', () => {
  const onChange = vi.fn();

  // [0] clock trigger, [1] hour up, [2] hour down, [3] min up, [4] min down,
  // [5]/[6] AM/PM up/down (12h only). The clear button carries a glyph.
  const steppers = () => screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');
  const openDropdown = () => fireEvent.click(steppers()[0]);

  beforeEach(() => {
    vi.clearAllMocks();
    resetAllStores();
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) });
  });

  const use12h = () => seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) });

  it('FE-W5TP-001: renders midnight as 12 AM in 12h mode', () => {
    use12h();
    render(<CustomTimePicker value="00:15" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('value', '12:15 AM');
  });

  it('FE-W5TP-002: keeps morning hours unshifted in 12h mode', () => {
    use12h();
    render(<CustomTimePicker value="09:05" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('value', '9:05 AM');
  });

  it('FE-W5TP-003: leaves an unparseable value untouched in 12h mode', () => {
    use12h();
    render(<CustomTimePicker value="later" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('value', 'later');
  });

  it('FE-W5TP-004: shows -- for an unparseable hour and minute', () => {
    render(<CustomTimePicker value="later" onChange={onChange} />);
    openDropdown();
    expect(screen.getAllByText('--')).toHaveLength(2);
  });

  it('FE-W5TP-005: stepping up from an unparseable hour lands on 00', () => {
    render(<CustomTimePicker value="later" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[1]);
    expect(onChange).toHaveBeenCalledWith('00:00');
  });

  it('FE-W5TP-006: stepping down from an unparseable hour lands on 00', () => {
    render(<CustomTimePicker value="later" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[2]);
    expect(onChange).toHaveBeenCalledWith('00:00');
  });

  it('FE-W5TP-007: the minute-down button borrows an hour when it wraps below zero', () => {
    render(<CustomTimePicker value="10:00" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[4]);
    expect(onChange).toHaveBeenCalledWith('09:55');
  });

  it('FE-W5TP-008: the minute-down button keeps the hour when it does not wrap', () => {
    render(<CustomTimePicker value="10:30" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[4]);
    expect(onChange).toHaveBeenCalledWith('10:25');
  });

  it('FE-W5TP-009: stepping minutes with no minute set falls back to :00', () => {
    render(<CustomTimePicker value="10" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[3]);
    expect(onChange).toHaveBeenLastCalledWith('10:00');
    fireEvent.click(steppers()[4]);
    expect(onChange).toHaveBeenLastCalledWith('10:00');
  });

  it('FE-W5TP-010: typing in 12h mode is passed through unparsed', () => {
    use12h();
    render(<CustomTimePicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5:30 pm' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('5:30 pm');
  });

  it('FE-W5TP-011: typing four digits inserts the colon while editing', () => {
    render(<CustomTimePicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1430' } });
    expect(onChange).toHaveBeenLastCalledWith('14:30');
  });

  it('FE-W5TP-012: typing a single-digit hour pads it while editing', () => {
    render(<CustomTimePicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '9:05' } });
    expect(onChange).toHaveBeenLastCalledWith('09:05');
  });

  it('FE-W5TP-013: typing a complete HH:MM leaves it as is', () => {
    render(<CustomTimePicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '14:30' } });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('14:30');
  });

  it('FE-W5TP-014: blurring an empty field does not emit', () => {
    render(<CustomTimePicker value="" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-W5TP-015: blurring an unparseable value does not emit', () => {
    render(<CustomTimePicker value="later" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-W5TP-016: 12h blur handles a bare hour with a meridiem', () => {
    use12h();
    render(<CustomTimePicker value="5pm" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('17:00');
  });

  it('FE-W5TP-017: 12h blur maps 12 AM to midnight and 12 PM to noon', () => {
    use12h();
    const { unmount } = render(<CustomTimePicker value="12:30 AM" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('00:30');
    unmount();

    onChange.mockClear();
    render(<CustomTimePicker value="12:30 PM" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('12:30');
  });

  it('FE-W5TP-018: 12h blur falls back to the numeric parser when no meridiem is given', () => {
    use12h();
    render(<CustomTimePicker value="1430" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('14:30');
  });

  it('FE-W5TP-019: blur clamps out-of-range hours and minutes', () => {
    render(<CustomTimePicker value="99:99" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('23:59');
  });

  it('FE-W5TP-020: blur pads a three-digit entry to HH:MM', () => {
    render(<CustomTimePicker value="945" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('09:45');
  });

  it('FE-W5TP-021: a mousedown inside the field keeps the dropdown open', () => {
    const { container } = render(<CustomTimePicker value="10:00" onChange={onChange} />);
    openDropdown();
    fireEvent.mouseDown(container.firstElementChild!);
    expect(screen.getByText('✕')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText('✕'));
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('FE-W5TP-022: the AM/PM stepper flips an AM hour to PM in both directions', () => {
    use12h();
    render(<CustomTimePicker value="02:00" onChange={onChange} />);
    openDropdown();
    expect(screen.getByText('AM')).toBeInTheDocument();

    fireEvent.click(steppers()[5]);
    expect(onChange).toHaveBeenLastCalledWith('14:00');
    fireEvent.click(steppers()[6]);
    expect(onChange).toHaveBeenLastCalledWith('14:00');
  });

  it('FE-W5TP-023: the AM/PM stepper flips a PM hour back to AM', () => {
    use12h();
    render(<CustomTimePicker value="14:00" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[5]);
    expect(onChange).toHaveBeenLastCalledWith('02:00');
    fireEvent.click(steppers()[6]);
    expect(onChange).toHaveBeenLastCalledWith('02:00');
  });

  it('FE-W5TP-025: stepping minutes with neither hour nor minute set lands on 00:00', () => {
    render(<CustomTimePicker value="later" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[3]);
    expect(onChange).toHaveBeenLastCalledWith('00:00');
    fireEvent.click(steppers()[4]);
    expect(onChange).toHaveBeenLastCalledWith('00:00');
  });

  it('FE-W5TP-028: minute wrapping carries an unparseable hour to 01 and 23', () => {
    const { unmount } = render(<CustomTimePicker value="x:55" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[3]);
    expect(onChange).toHaveBeenLastCalledWith('01:00');
    unmount();

    onChange.mockClear();
    render(<CustomTimePicker value="x:00" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[4]);
    expect(onChange).toHaveBeenLastCalledWith('23:55');
  });

  it('FE-W5TP-029: the AM/PM stepper defaults the minute when none is set', () => {
    use12h();
    const { unmount } = render(<CustomTimePicker value="14" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[5]);
    expect(onChange).toHaveBeenLastCalledWith('02:00');

    onChange.mockClear();
    fireEvent.click(steppers()[6]);
    expect(onChange).toHaveBeenLastCalledWith('02:00');
    unmount();

    onChange.mockClear();
    render(<CustomTimePicker value="02" onChange={onChange} />);
    openDropdown();
    fireEvent.click(steppers()[5]);
    expect(onChange).toHaveBeenLastCalledWith('14:00');
    fireEvent.click(steppers()[6]);
    expect(onChange).toHaveBeenLastCalledWith('14:00');
  });

  it('FE-W5TP-026: typing a value with no digits is passed through unchanged', () => {
    render(<CustomTimePicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'noon' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('noon');
  });

  it('FE-W5TP-027: 12h blur keeps an AM hour below noon', () => {
    use12h();
    render(<CustomTimePicker value="5:30 AM" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('05:30');
  });

  it('FE-W5TP-030: a meridiem typed while 24h is configured survives until blur', () => {
    render(<CustomTimePicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5:30 pm' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('5:30 pm');
  });

  it('FE-W5TP-031: blur reads a meridiem correctly while 24h is configured', () => {
    render(<CustomTimePicker value="5:30 pm" onChange={onChange} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onChange).toHaveBeenCalledWith('17:30');
  });

  it('FE-W5TP-024: the steppers and the clear button highlight on hover', () => {
    use12h();
    render(<CustomTimePicker value="00:30" onChange={onChange} />);
    openDropdown();
    // 12 is the 12h rendering of hour 0
    expect(screen.getByText('12')).toBeInTheDocument();

    for (const btn of steppers()) {
      fireEvent.mouseEnter(btn);
      expect(btn.style.color).toBe('var(--text-primary)');
      fireEvent.mouseLeave(btn);
      expect(btn.style.color).toBe('var(--text-faint)');
    }

    const clear = screen.getByText('✕');
    fireEvent.mouseEnter(clear);
    expect(clear.style.color).toBe('rgb(239, 68, 68)');
    fireEvent.mouseLeave(clear);
    expect(clear.style.color).toBe('var(--text-faint)');
  });
});

// FE-TP1725-001 to -006 — the configured time format decides how a time is shown,
// including values that were stored with a meridiem (booking check-in/check-out
// times entered while 12h was set, or carried in by an import).
describe('CustomTimePicker honours the configured time format', () => {
  const onChange = vi.fn();
  const steppers = () => screen.getAllByRole('button').filter(b => b.textContent?.trim() === '');

  beforeEach(() => {
    vi.clearAllMocks();
    resetAllStores();
  });

  const use = (time_format: string) => seedStore(useSettingsStore, { settings: buildSettings({ time_format }) });

  it('FE-TP1725-001: shows a stored meridiem value in 24h', () => {
    use('24h');
    render(<CustomTimePicker value="3:00 PM" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('value', '15:00');
  });

  it('FE-TP1725-002: keeps a stored meridiem value in 12h', () => {
    use('12h');
    render(<CustomTimePicker value="3:00 PM" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('value', '3:00 PM');
  });

  it('FE-TP1725-003: converts a 24h value for a 12h user', () => {
    use('12h');
    render(<CustomTimePicker value="15:00" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('value', '3:00 PM');
  });

  it('FE-TP1725-004: the dropdown steppers start from the converted value', () => {
    use('24h');
    render(<CustomTimePicker value="3:00 PM" onChange={onChange} />);
    fireEvent.click(steppers()[0]);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();
    fireEvent.click(steppers()[1]);
    expect(onChange).toHaveBeenLastCalledWith('16:00');
  });

  it('FE-TP1725-005: the empty-field hint follows the setting', () => {
    use('24h');
    const { unmount } = render(<CustomTimePicker value="" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('placeholder', '00:00');
    unmount();

    use('12h');
    render(<CustomTimePicker value="" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('placeholder', '2:30 PM');
  });

  it('FE-TP1725-006: a 24h value is left alone in 24h', () => {
    use('24h');
    render(<CustomTimePicker value="14:30" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveProperty('value', '14:30');
  });

  // Display alone is not enough: a value stored as "3:00 PM" stays that way in the
  // database until someone edits the field. The picker hands the parsed HH:MM back to
  // the form instead, so the next save writes a clean value.
  const Controlled = ({ initial }: { initial: string }) => {
    const [v, setV] = useState(initial);
    return <CustomTimePicker value={v} onChange={nv => { onChange(nv); setV(nv); }} />;
  };

  it('FE-TP1725-007: a stored meridiem value is handed back as HH:MM without an edit', () => {
    use('24h');
    render(<Controlled initial="3:00 PM" />);
    expect(onChange).toHaveBeenCalledWith('15:00');
    expect(screen.getByRole('textbox')).toHaveProperty('value', '15:00');
  });

  it('FE-TP1725-008: typing a meridiem is left alone until the field is left', () => {
    use('24h');
    render(<Controlled initial="" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '5:30 pm' } });
    expect(input).toHaveProperty('value', '5:30 pm');
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('17:30');
    expect(input).toHaveProperty('value', '17:30');
  });

  it('FE-TP1725-009: a clean value is not written back', () => {
    use('24h');
    render(<Controlled initial="14:30" />);
    expect(onChange).not.toHaveBeenCalled();
  });
});
