import userEvent from '@testing-library/user-event';
import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import { useSettingsStore } from '../../store/settingsStore';
import { CustomDatePicker, CustomDateTimePicker } from './CustomDateTimePicker';

// ─── CustomDatePicker ─────────────────────────────────────────────────────────

describe('CustomDatePicker', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FE-COMP-DATEPICKER-001: renders without crashing', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    expect(document.body).toBeTruthy();
  });

  it('FE-COMP-DATEPICKER-002: shows placeholder when no value', () => {
    render(<CustomDatePicker value="" onChange={onChange} placeholder="Start Date" />);
    expect(screen.getByText('Start Date')).toBeTruthy();
  });

  it('FE-COMP-DATEPICKER-003: shows formatted date when value is set', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    const btn = screen.getAllByRole('button')[0];
    // Locale-formatted date should contain "Mar" or "15" or "2026"
    expect(btn.textContent).toMatch(/Mar|15|2026/);
  });

  it('FE-COMP-DATEPICKER-004: clicking button opens calendar portal', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]);
    const dayBtns = screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent?.trim() ?? ''));
    expect(dayBtns.length).toBeGreaterThan(0);
  });

  it('FE-COMP-DATEPICKER-005: clicking a day calls onChange with correct ISO date', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-01" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open March 2026
    const dayBtn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === '15');
    await user.click(dayBtn!);
    expect(onChange).toHaveBeenCalledWith('2026-03-15');
  });

  it('FE-COMP-DATEPICKER-006: prev month navigation decrements month', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-01" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open March 2026
    // Nav buttons have no text content (only SVG icons)
    await user.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByText(/february 2026/i)).toBeTruthy();
  });

  it('FE-COMP-DATEPICKER-007: next month navigation increments month', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-01" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open March 2026
    const emptyBtns = screen.getAllByRole('button').filter((b) => b.textContent?.trim() === '');
    await user.click(emptyBtns[emptyBtns.length - 1]); // right chevron = next month
    expect(screen.getByText(/april 2026/i)).toBeTruthy();
  });

  it('FE-COMP-DATEPICKER-008: clear button calls onChange with empty string', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open
    const clearBtn = screen.getByText('✕');
    await user.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('FE-COMP-DATEPICKER-009: clear button absent when no value', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open
    expect(screen.queryByText('✕')).toBeNull();
  });

  it('FE-COMP-DATEPICKER-010: clicking outside calendar closes it', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open
    // Verify calendar is open (day buttons present)
    expect(
      screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent?.trim() ?? '')).length
    ).toBeGreaterThan(0);
    // Fire mousedown outside both the component div and the portal
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    await act(async () => {
      fireEvent.mouseDown(outsideEl);
    });
    document.body.removeChild(outsideEl);
    // Day buttons should be gone
    expect(screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent?.trim() ?? '')).length).toBe(0);
  });

  it('FE-COMP-DATEPICKER-011: keyboard icon activates text input mode', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /enter date manually/i }));
    expect(screen.getByPlaceholderText('DD.MM.YYYY')).toBeTruthy();
  });

  it('FE-COMP-DATEPICKER-012: text input accepts ISO format YYYY-MM-DD', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '2026-07-04' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('2026-07-04');
  });

  it('FE-COMP-DATEPICKER-013: text input accepts EU format DD.MM.YYYY', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '17.07.2026' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('2026-07-17');
  });

  it('FE-COMP-DATEPICKER-014: Escape in text input cancels text mode', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('DD.MM.YYYY')).toBeNull();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});

// ─── CustomDateTimePicker ─────────────────────────────────────────────────────

describe('CustomDateTimePicker', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Use 24h format for predictable time input behavior
    useSettingsStore.setState({
      settings: { ...useSettingsStore.getState().settings, time_format: '24h' },
    });
  });

  it('FE-COMP-DATEPICKER-015: renders date and time pickers side by side', () => {
    render(<CustomDateTimePicker value="" onChange={onChange} />);
    // Date picker renders a trigger button
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
    // Time picker renders a text input
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('FE-COMP-DATEPICKER-016: setting a date-only value defaults time to 12:00', async () => {
    const user = userEvent.setup();
    render(<CustomDateTimePicker value="" onChange={onChange} />);
    // The date trigger is the first button
    const dateTrigger = screen.getAllByRole('button')[0];
    await user.click(dateTrigger); // open calendar
    // Click day 1
    const day1 = screen.getAllByRole('button').find((b) => b.textContent?.trim() === '1');
    await user.click(day1!);
    // onChange should have been called with T12:00 suffix
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/T12:00$/));
  });

  it('FE-COMP-DATEPICKER-017: changing time part preserves date part', () => {
    render(<CustomDateTimePicker value="2026-06-01T09:30" onChange={onChange} />);
    const timeInput = screen.getByRole('textbox');
    fireEvent.change(timeInput, { target: { value: '10:00' } });
    expect(onChange).toHaveBeenCalledWith('2026-06-01T10:00');
  });

  it('FE-COMP-DATEPICKER-018: clicking month/year label switches to months view', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar
    // The header label button has aria-label "Select month" when in days view
    const headerBtn = screen.getByRole('button', { name: /select month/i });
    await user.click(headerBtn);
    // Month grid should appear — at least Jan/Feb/Mar etc.
    const monthBtns = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') !== null && /^\D/.test(b.textContent?.trim() ?? ''));
    expect(monthBtns.length).toBe(12);
  });

  it('FE-COMP-DATEPICKER-019: selecting a month in months view returns to days view', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar

    // Drill into months view
    const headerBtn = screen.getByRole('button', { name: /select month/i });
    await user.click(headerBtn);

    // Click the month that has aria-pressed=false and corresponds to June
    const junBtn = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-label')?.includes('June') || b.getAttribute('aria-label')?.includes('Jun'));
    await user.click(junBtn!);

    // Should be back in days view: weekday headers visible
    const dayBtns = screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent?.trim() ?? ''));
    expect(dayBtns.length).toBeGreaterThan(0);
  });

  it('FE-COMP-DATEPICKER-020: clicking year label in months view switches to years view', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar

    // Drill into months view
    await user.click(screen.getByRole('button', { name: /select month/i }));

    // The header now shows the year; aria-label is "Select year"
    const yearHeaderBtn = screen.getByRole('button', { name: /select year/i });
    await user.click(yearHeaderBtn);

    // Years grid: buttons with 4-digit numeric text
    const yearBtns = screen.getAllByRole('button').filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''));
    expect(yearBtns.length).toBe(12);
  });

  it('FE-COMP-DATEPICKER-021: selecting a year in years view returns to months view', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar

    // Drill into years view
    await user.click(screen.getByRole('button', { name: /select month/i }));
    await user.click(screen.getByRole('button', { name: /select year/i }));

    // Pick 2028
    const yr2027 = screen.getByRole('button', { name: '2027' });
    await user.click(yr2027);

    // Should return to months view: 12 month buttons visible
    const monthBtns = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') !== null && /^\D/.test(b.textContent?.trim() ?? ''));
    expect(monthBtns.length).toBe(12);
  });

  it('FE-COMP-DATEPICKER-022: prev/next in months view changes year, not month', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar
    await user.click(screen.getByRole('button', { name: /select month/i }));

    // The header now shows "2026"; click Previous year
    await user.click(screen.getByRole('button', { name: /previous year/i }));
    expect(screen.getByRole('button', { name: /select year/i }).textContent?.trim()).toBe('2025');
  });

  it('FE-COMP-DATEPICKER-023: prev/next in years view pages the year grid', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar
    await user.click(screen.getByRole('button', { name: /select month/i }));
    await user.click(screen.getByRole('button', { name: /select year/i }));

    // Note current first year
    const yearsBefore = screen
      .getAllByRole('button')
      .filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''))
      .map((b) => parseInt(b.textContent!.trim()));
    const firstBefore = Math.min(...yearsBefore);

    await user.click(screen.getByRole('button', { name: /next years/i }));

    const yearsAfter = screen
      .getAllByRole('button')
      .filter((b) => /^\d{4}$/.test(b.textContent?.trim() ?? ''))
      .map((b) => parseInt(b.textContent!.trim()));
    const firstAfter = Math.min(...yearsAfter);

    expect(firstAfter).toBe(firstBefore + 12);
  });

  it('FE-COMP-DATEPICKER-024: calendar opens back in days view after being closed', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);

    await user.click(screen.getAllByRole('button')[0]); // open
    await user.click(screen.getByRole('button', { name: /select month/i }));

    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    await act(async () => {
      fireEvent.mouseDown(outsideEl);
    });
    document.body.removeChild(outsideEl);

    await user.click(screen.getAllByRole('button')[0]); // reopen
    const dayBtns = screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent?.trim() ?? ''));
    expect(dayBtns.length).toBeGreaterThan(0);
  });

  // ── Keyboard icon trigger ─────────────────────────────────────────────────

  it('FE-COMP-DATEPICKER-025: selected month has aria-pressed=true in months view', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar
    await user.click(screen.getByRole('button', { name: /select month/i }));

    // March should be aria-pressed=true
    const marBtn = screen.getAllByRole('button').find((b) => b.getAttribute('aria-label') === 'March 2026');
    expect(marBtn?.getAttribute('aria-pressed')).toBe('true');
  });

  it('FE-COMP-DATEPICKER-026: selected year has aria-pressed=true in years view', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    await user.click(screen.getAllByRole('button')[0]); // open calendar
    await user.click(screen.getByRole('button', { name: /select month/i }));
    await user.click(screen.getByRole('button', { name: /select year/i }));

    const yr2026 = screen.getByRole('button', { name: '2026' });
    expect(yr2026.getAttribute('aria-pressed')).toBe('true');
  });
});
