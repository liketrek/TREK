// FE-PLANNER-FILEBTNS-001 to FE-PLANNER-FILEBTNS-009
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { buildTripFile } from '../../../tests/helpers/factories';
import { BookingFileButtons } from './BookingFileButtons';
import type { TripFile } from '../../types';

const voucher = buildTripFile({ id: 1, original_name: 'voucher.pdf' });
const ticket = buildTripFile({ id: 2, original_name: 'ticket.pdf' });

function renderButtons(props: Partial<React.ComponentProps<typeof BookingFileButtons>> = {}) {
  const onAttach = vi.fn();
  const onLink = vi.fn(async (_file: TripFile) => true);
  const view = render(
    <BookingFileButtons canAttach uploading={false} onAttach={onAttach} linkable={[voucher, ticket]} onLink={onLink} {...props} />,
  );
  return { ...view, onAttach, onLink };
}

const linkButton = () => screen.getByRole('button', { name: /Link existing file/ });

describe('BookingFileButtons', () => {
  it('FE-PLANNER-FILEBTNS-001: attach and link sit side by side as two equal buttons', () => {
    renderButtons();
    const attach = screen.getByRole('button', { name: /Attach file/ });
    expect(attach).toBeEnabled();
    expect(linkButton()).toHaveAttribute('aria-expanded', 'false');
    expect((attach.parentElement as HTMLElement).style.gridTemplateColumns).toBe('1fr 1fr');
  });

  it('FE-PLANNER-FILEBTNS-002: attach calls onAttach', async () => {
    const user = userEvent.setup();
    const { onAttach } = renderButtons();
    await user.click(screen.getByRole('button', { name: /Attach file/ }));
    expect(onAttach).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-FILEBTNS-003: while uploading the attach button says so and is disabled', () => {
    renderButtons({ uploading: true });
    const attach = screen.getByRole('button', { name: /Uploading/ });
    expect(attach).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Attach file/ })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-FILEBTNS-004: without upload rights only the link button is left, full width', () => {
    renderButtons({ canAttach: false });
    expect(screen.queryByRole('button', { name: /Attach file/ })).not.toBeInTheDocument();
    const wrapper = linkButton().parentElement!.parentElement as HTMLElement;
    expect(wrapper.style.gridTemplateColumns).toBe('1fr');
  });

  it('FE-PLANNER-FILEBTNS-005: with nothing to link only attach is shown', () => {
    renderButtons({ linkable: [] });
    expect(screen.getByRole('button', { name: /Attach file/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Link existing file/ })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-FILEBTNS-006: with neither right nor candidates it renders nothing', () => {
    const { container } = renderButtons({ canAttach: false, linkable: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-PLANNER-FILEBTNS-007: the link button opens and closes the list of the trip files', async () => {
    const user = userEvent.setup();
    renderButtons();
    expect(screen.queryByText('voucher.pdf')).not.toBeInTheDocument();
    await user.click(linkButton());
    expect(linkButton()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('voucher.pdf')).toBeInTheDocument();
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument();
    await user.click(linkButton());
    expect(screen.queryByText('voucher.pdf')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-FILEBTNS-008: picking a file links it and a success closes the list, a failure keeps it open', async () => {
    const user = userEvent.setup();
    const onLink = vi.fn(async (file: TripFile) => file.id === 2);
    renderButtons({ onLink });
    await user.click(linkButton());

    await user.click(screen.getByText('voucher.pdf'));
    expect(onLink).toHaveBeenCalledWith(voucher);
    // The link failed (resolved false), so the list stays for another try.
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument();

    await user.click(screen.getByText('ticket.pdf'));
    expect(onLink).toHaveBeenCalledWith(ticket);
    await waitFor(() => expect(screen.queryByText('ticket.pdf')).not.toBeInTheDocument());
  });

  it('FE-PLANNER-FILEBTNS-009: a pointer outside the picker closes the list, one inside does not', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BookingFileButtons canAttach={false} uploading={false} onAttach={vi.fn()} linkable={[voucher]} onLink={vi.fn(async () => false)} />
        <p>elsewhere</p>
      </div>,
    );
    await user.click(linkButton());
    fireEvent.pointerDown(screen.getByText('voucher.pdf'));
    expect(screen.getByText('voucher.pdf')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByText('elsewhere'));
    expect(screen.queryByText('voucher.pdf')).not.toBeInTheDocument();
  });
});
