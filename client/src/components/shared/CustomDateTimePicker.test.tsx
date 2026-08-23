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

  it('FE-COMP-DATEPICKER-031: text input rejects a day the month does not have', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '31.02.2026' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-COMP-DATEPICKER-032: text input still accepts 29 February in a leap year', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '29.02.2024' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('2024-02-29');
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

  // ── min/max range restriction (#1662) ──────────────────────────────────────

  it('FE-COMP-DATEPICKER-027: days outside [min,max] are disabled and not clickable', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} min="2026-03-10" max="2026-03-20" />);
    await user.click(screen.getAllByRole('button')[0]); // open March 2026
    const day5 = screen.getAllByRole('button').find((b) => b.textContent?.trim() === '5');
    expect((day5 as HTMLButtonElement).disabled).toBe(true);
    await user.click(day5!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-COMP-DATEPICKER-028: days within [min,max] stay selectable', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} min="2026-03-10" max="2026-03-20" />);
    await user.click(screen.getAllByRole('button')[0]); // open March 2026
    const day12 = screen.getAllByRole('button').find((b) => b.textContent?.trim() === '12');
    expect((day12 as HTMLButtonElement).disabled).toBe(false);
    await user.click(day12!);
    expect(onChange).toHaveBeenCalledWith('2026-03-12');
  });

  it('FE-COMP-DATEPICKER-029: manual entry of an out-of-range date is rejected', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} min="2026-03-10" max="2026-03-20" />);
    await user.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '2026-03-25' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-COMP-DATEPICKER-030: empty value opens the calendar on the first in-range month', async () => {
    const user = userEvent.setup();
    render(<CustomDatePicker value="" onChange={onChange} min="2026-03-10" max="2026-03-20" />);
    await user.click(screen.getAllByRole('button')[0]); // open — should land on March 2026
    expect(screen.getByText(/march 2026/i)).toBeTruthy();
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

// FE-W5DP-001 to FE-W5DP-021 — the remaining calendar branches: year/month
// wrapping, the locale-order parser arms, viewport clamping of the popup,
// compact/borderless layout and the hover styling of every grid cell.
describe('CustomDatePicker branches', () => {
  const onChange = vi.fn();
  const openCalendar = () => fireEvent.click(screen.getAllByRole('button')[0]);
  const dayCell = (label: string) =>
    screen.getAllByRole('button').find((b) => b.textContent?.trim() === label) as HTMLButtonElement;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FE-W5DP-001: a mousedown inside the trigger or the popup keeps the calendar open', () => {
    const { container } = render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    openCalendar();
    const dialog = screen.getByRole('dialog');

    fireEvent.mouseDown(container.firstElementChild!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('FE-W5DP-002: with only a max bound the calendar opens on that month', () => {
    render(<CustomDatePicker value="" onChange={onChange} max="2026-11-20" />);
    openCalendar();
    expect(screen.getByText(/november 2026/i)).toBeInTheDocument();
  });

  it('FE-W5DP-003: paging back from January lands on the previous December', () => {
    render(<CustomDatePicker value="2026-01-15" onChange={onChange} />);
    openCalendar();
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByText(/december 2025/i)).toBeInTheDocument();
  });

  it('FE-W5DP-004: paging forward from December lands on the next January', () => {
    render(<CustomDatePicker value="2026-12-15" onChange={onChange} />);
    openCalendar();
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText(/january 2027/i)).toBeInTheDocument();
  });

  it('FE-W5DP-005: the months view pages the year in both directions', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    openCalendar();
    fireEvent.click(screen.getByRole('button', { name: /select month/i }));

    fireEvent.click(screen.getByRole('button', { name: /next year/i }));
    expect(screen.getByRole('button', { name: 'March 2027' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /previous year/i }));
    expect(screen.getByRole('button', { name: 'March 2026' })).toBeInTheDocument();
  });

  it('FE-W5DP-006: the years view pages the grid in both directions', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    openCalendar();
    fireEvent.click(screen.getByRole('button', { name: /select month/i }));
    fireEvent.click(screen.getByRole('button', { name: /select year/i }));

    fireEvent.click(screen.getByRole('button', { name: /previous years/i }));
    expect(screen.getByRole('button', { name: '2014' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next years/i }));
    expect(screen.getByRole('button', { name: '2026' })).toBeInTheDocument();
  });

  it('FE-W5DP-007: compact mode renders the short numeric date and drops the calendar glyph', () => {
    const { container } = render(<CustomDatePicker value="2026-03-15" onChange={onChange} compact />);
    expect(screen.getByText('03/15/26')).toBeInTheDocument();
    expect(container.querySelector('.lucide-calendar')).toBeNull();
  });

  it('FE-W5DP-008: borderless mode drops the border and the inline keyboard trigger', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} borderless />);
    const trigger = screen.getAllByRole('button')[0];
    expect(trigger.style.borderStyle).toBe('none');
    expect(trigger.style.background).toBe('transparent');
    expect(screen.queryByRole('button', { name: /enter date manually/i })).not.toBeInTheDocument();
  });

  it('FE-W5DP-009: the trigger only resets its border colour while the calendar is closed', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    const trigger = screen.getAllByRole('button')[0];

    fireEvent.mouseEnter(trigger);
    expect(trigger.style.borderColor).toBe('var(--text-faint)');
    fireEvent.mouseLeave(trigger);
    expect(trigger.style.borderColor).toBe('var(--border-primary)');

    fireEvent.click(trigger);
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    expect(trigger.style.borderColor).toBe('var(--text-faint)');
  });

  it('FE-W5DP-022: the inline manual-entry trigger highlights on hover', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    const keyboard = screen.getByRole('button', { name: /enter date manually/i });

    fireEvent.mouseEnter(keyboard);
    expect(keyboard.style.color).toBe('var(--text-primary)');
    expect(keyboard.style.borderColor).toBe('var(--text-faint)');
    fireEvent.mouseLeave(keyboard);
    expect(keyboard.style.color).toBe('var(--text-faint)');
    expect(keyboard.style.borderColor).toBe('var(--border-primary)');
  });

  it('FE-W5DP-023: the compact footer trigger opens an empty manual entry when no date is set', () => {
    render(<CustomDatePicker value="" onChange={onChange} compact />);
    openCalendar();
    fireEvent.click(screen.getByRole('button', { name: /enter date manually/i }));

    expect(screen.getByPlaceholderText('DD.MM.YYYY')).toHaveProperty('value', '');
  });

  it('FE-W5DP-010: submitting an empty manual entry does nothing', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter date manually/i }));
    fireEvent.blur(screen.getByPlaceholderText('DD.MM.YYYY'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('DD.MM.YYYY')).not.toBeInTheDocument();
  });

  it('FE-W5DP-011: a manual entry without three number groups is ignored', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '17.07' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-W5DP-012: a manual entry already in locale order is taken as typed', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '07/17/2026' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('2026-07-17');
  });

  it('FE-W5DP-013: a two-digit year is expanded into the 2000s', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '07/17/26' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('2026-07-17');
  });

  it('FE-W5DP-014: an impossible day/month combination is rejected', () => {
    render(<CustomDatePicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '13/45/2026' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-W5DP-015: a localised manual entry outside [min,max] is rejected', () => {
    render(<CustomDatePicker value="" onChange={onChange} min="2026-03-10" max="2026-03-20" />);
    fireEvent.click(screen.getByRole('button', { name: /enter date manually/i }));
    const input = screen.getByPlaceholderText('DD.MM.YYYY');
    fireEvent.change(input, { target: { value: '03/25/2026' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('FE-W5DP-016: the popup is clamped back into a narrow viewport', () => {
    const originalRect = Element.prototype.getBoundingClientRect;
    const originalWidth = window.innerWidth;
    Element.prototype.getBoundingClientRect = function () {
      return { left: 900, top: 700, right: 1100, bottom: 740, width: 200, height: 40, x: 900, y: 700, toJSON: () => ({}) } as DOMRect;
    };
    Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });

    try {
      render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
      openCalendar();
      const dialog = screen.getByRole('dialog');
      // vw < 360 centres the 268px popup; the popup flips above the trigger
      expect(dialog.style.left).toBe('26px');
      expect(dialog.style.top).toBe('336px');
    } finally {
      Element.prototype.getBoundingClientRect = originalRect;
      Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
    }
  });

  it('FE-W5DP-017: the popup prefers the visual viewport height when one is reported', () => {
    const originalRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      return { left: 20, top: 40, right: 220, bottom: 80, width: 200, height: 40, x: 20, y: 40, toJSON: () => ({}) } as DOMRect;
    };
    Object.defineProperty(window, 'visualViewport', { value: { height: 900 }, configurable: true });

    try {
      render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
      openCalendar();
      const dialog = screen.getByRole('dialog');
      expect(dialog.style.left).toBe('20px');
      expect(dialog.style.top).toBe('84px');
    } finally {
      Element.prototype.getBoundingClientRect = originalRect;
      Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
    }
  });

  it('FE-W5DP-018: the header arrows and the label highlight on hover', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    openCalendar();

    for (const name of [/previous month/i, /next month/i]) {
      const btn = screen.getByRole('button', { name });
      fireEvent.mouseEnter(btn);
      expect(btn.style.color).toBe('var(--text-primary)');
      fireEvent.mouseLeave(btn);
      expect(btn.style.color).toBe('var(--text-faint)');
    }

    const header = screen.getByRole('button', { name: /select month/i });
    fireEvent.mouseEnter(header);
    expect(header.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(header);
    expect(header.style.background).toBe('none');
  });

  it('FE-W5DP-019: only free day cells take the hover background', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} min="2026-03-10" max="2026-03-20" />);
    openCalendar();

    const free = dayCell('12');
    fireEvent.mouseEnter(free);
    expect(free.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(free);
    expect(free.style.background).toBe('transparent');

    const selected = dayCell('15');
    fireEvent.mouseEnter(selected);
    expect(selected.style.background).toBe('var(--accent)');
    fireEvent.mouseLeave(selected);
    expect(selected.style.background).toBe('var(--accent)');

    const blocked = dayCell('5');
    fireEvent.mouseEnter(blocked);
    expect(blocked.style.background).toBe('transparent');
  });

  it('FE-W5DP-020: month and year cells take the hover background unless selected', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} />);
    openCalendar();
    fireEvent.click(screen.getByRole('button', { name: /select month/i }));

    const may = screen.getByRole('button', { name: 'May 2026' });
    fireEvent.mouseEnter(may);
    expect(may.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(may);
    expect(may.style.background).toBe('transparent');

    const march = screen.getByRole('button', { name: 'March 2026' });
    fireEvent.mouseEnter(march);
    fireEvent.mouseLeave(march);
    expect(march.style.background).toBe('var(--accent)');

    fireEvent.click(screen.getByRole('button', { name: /select year/i }));
    const y2027 = screen.getByRole('button', { name: '2027' });
    fireEvent.mouseEnter(y2027);
    expect(y2027.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(y2027);
    expect(y2027.style.background).toBe('transparent');

    const y2026 = screen.getByRole('button', { name: '2026' });
    fireEvent.mouseEnter(y2026);
    fireEvent.mouseLeave(y2026);
    expect(y2026.style.background).toBe('var(--accent)');
  });

  it('FE-W5DP-021: in compact mode the manual-entry trigger moves into the popup footer', () => {
    render(<CustomDatePicker value="2026-03-15" onChange={onChange} compact />);
    openCalendar();

    const keyboard = screen.getByRole('button', { name: /enter date manually/i });
    fireEvent.mouseEnter(keyboard);
    expect(keyboard.style.color).toBe('var(--text-primary)');
    fireEvent.mouseLeave(keyboard);
    expect(keyboard.style.color).toBe('var(--text-faint)');

    const clear = screen.getByRole('button', { name: /clear date/i });
    fireEvent.mouseEnter(clear);
    expect(clear.style.color).toBe('rgb(239, 68, 68)');
    fireEvent.mouseLeave(clear);
    expect(clear.style.color).toBe('var(--text-faint)');

    fireEvent.click(keyboard);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('DD.MM.YYYY')).toHaveProperty('value', '03/15/2026');
  });
});

// FE-W5DTP-001 to FE-W5DTP-002
describe('CustomDateTimePicker branches', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      settings: { ...useSettingsStore.getState().settings, time_format: '24h' },
    });
  });

  it('FE-W5DTP-001: clearing the date clears the whole value', () => {
    render(<CustomDateTimePicker value="2026-03-15T09:30" onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('button', { name: /clear date/i }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('FE-W5DTP-003: setting a time without a date falls back to today', () => {
    render(<CustomDateTimePicker value="" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').filter((b) => b.textContent?.trim() === '').pop();
    fireEvent.click(clockBtn!);
    // hour up on an empty time yields 01:00 on today's date
    const steppers = screen.getAllByRole('button').filter((b) => b.textContent?.trim() === '');
    fireEvent.click(steppers[steppers.length - 4]);

    const today = new Date().toISOString().split('T')[0];
    expect(onChange).toHaveBeenCalledWith(`${today}T01:00`);
  });

  it('FE-W5DTP-002: clearing the time keeps the date part', () => {
    render(<CustomDateTimePicker value="2026-03-15T09:30" onChange={onChange} />);
    const clockBtn = screen.getAllByRole('button').filter((b) => b.textContent?.trim() === '').pop();
    fireEvent.click(clockBtn!);
    fireEvent.click(screen.getByText('✕'));

    expect(onChange).toHaveBeenCalledWith('2026-03-15');
  });
});
