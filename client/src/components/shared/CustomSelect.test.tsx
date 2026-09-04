import { render, screen, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import CustomSelect from './CustomSelect';

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('CustomSelect', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  it('FE-COMP-SELECT-001: renders placeholder when no value is selected', () => {
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} placeholder="Pick a fruit" />);
    expect(screen.getByText('Pick a fruit')).toBeTruthy();
  });

  it('FE-COMP-SELECT-002: renders the selected option label', () => {
    render(<CustomSelect value="banana" onChange={onChange} options={OPTIONS} placeholder="Pick" />);
    expect(screen.getByText('Banana')).toBeTruthy();
  });

  it('FE-COMP-SELECT-003: clicking trigger opens the dropdown', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} />);
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    // All options should now be visible in the portal
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Banana')).toBeTruthy();
    expect(screen.getByText('Cherry')).toBeTruthy();
  });

  it('FE-COMP-SELECT-004: options are displayed in the dropdown', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1); // trigger + option buttons
  });

  it('FE-COMP-SELECT-005: clicking an option calls onChange with correct value', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole('button')); // open
    // Options in dropdown are also buttons
    const optionBtns = screen.getAllByRole('button');
    // Find the Cherry option button (not the trigger which shows placeholder)
    const cherryBtn = optionBtns.find(b => b.textContent?.includes('Cherry'));
    await user.click(cherryBtn!);
    expect(onChange).toHaveBeenCalledWith('cherry');
  });

  it('FE-COMP-SELECT-006: clicking an option closes the dropdown', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole('button')); // open
    const optionBtns = screen.getAllByRole('button');
    const appleBtn = optionBtns.find(b => b.textContent?.includes('Apple'));
    await user.click(appleBtn!);
    // After selection, only the trigger button remains in DOM
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('FE-COMP-SELECT-007: searchable mode filters options by typed text', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} searchable={true} />);
    await user.click(screen.getByRole('button')); // open

    const searchInput = screen.getByPlaceholderText('...');
    await user.type(searchInput, 'ban');

    // Only Banana should remain, Apple and Cherry should be filtered out
    expect(screen.getByText('Banana')).toBeTruthy();
    expect(screen.queryByText('Apple')).toBeNull();
    expect(screen.queryByText('Cherry')).toBeNull();
  });

  // #2078 — the panel is portaled to document.body and positioned fixed, so its
  // scroll chain runs to the viewport, not to the sheet it visually sits in. On a
  // phone a flick past either end of the list moved the page instead.
  it('FE-COMP-SELECT-009: the option list keeps its scroll to itself', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole('button'));

    const list = screen.getByText('Apple').closest('div[style*="overflow"]') as HTMLElement;
    expect(list.style.overscrollBehavior).toBe('contain');
  });

  it('FE-COMP-SELECT-010: it is still a bounded scroller, not a contained page', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole('button'));

    // Guards the other half: containment without a height cap would just make the
    // panel grow off screen.
    const list = screen.getByText('Apple').closest('div[style*="overflow"]') as HTMLElement;
    expect(list.style.overflowY).toBe('auto');
    expect(Number.parseInt(list.style.maxHeight, 10)).toBeGreaterThan(0);
  });

  // A select squeezed into a narrow flex row still has to offer readable options: the
  // trigger shortens to share its row with the control beside it, the menu does not.
  it('FE-COMP-SELECT-011: the menu is as wide as its trigger by default', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole('button'));

    const panel = screen.getByText('Apple').closest('div[style*="position: fixed"]') as HTMLElement;
    expect(panel.style.width).not.toBe('max-content');
    expect(panel.style.maxWidth).toBe('');
  });

  it('FE-COMP-SELECT-012: menuFit content grows the menu to its options, bounded twice', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} menuFit="content" />);
    await user.click(screen.getByRole('button'));

    const panel = screen.getByText('Apple').closest('div[style*="position: fixed"]') as HTMLElement;
    expect(panel.style.width).toBe('max-content');
    // Never narrower than the trigger, never wider than what the window still has.
    expect(panel.style.minWidth).not.toBe('');
    expect(Number.parseInt(panel.style.maxWidth, 10)).toBeGreaterThan(0);
  });

  it('FE-COMP-SELECT-013: a content-fitted menu stops at the edge of its panel', async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="panel">
        <CustomSelect value="" onChange={onChange} options={OPTIONS} menuFit="content" />
      </div>,
    );
    // jsdom measures everything as zero, so the panel says how wide it is.
    const panel = screen.getByTestId('panel');
    panel.getBoundingClientRect = () => ({ left: 0, right: 180, width: 180, top: 0, bottom: 32, height: 32, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    await user.click(screen.getByRole('button'));

    const menu = screen.getByText('Apple').closest('div[style*="position: fixed"]') as HTMLElement;
    expect(menu.style.maxWidth).toBe('180px');
  });

  it('FE-COMP-SELECT-008: disabled state prevents the dropdown from opening', async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="" onChange={onChange} options={OPTIONS} disabled={true} placeholder="Pick" />);
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    // Dropdown should not be in the DOM — options remain hidden
    expect(screen.queryByText('Apple')).toBeNull();
  });
});
