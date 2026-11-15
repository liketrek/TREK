// FE-PACKDETAIL-001 to FE-PACKDETAIL-024
import { http, HttpResponse } from 'msw';
import type { ComponentProps } from 'react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPackingItem, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { fireEvent, render, screen, waitFor, within } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import type { PackingBag, PackingItem } from '../../types';
import { PackingItemDetail } from './PackingItemDetail';
import type { TripMember } from './usePackingListPanel';

type Props = ComponentProps<typeof PackingItemDetail>;

const toastError = vi.hoisted(() => vi.fn());
vi.mock('../shared/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: toastError, info: vi.fn(), warning: vi.fn() }),
}));
const MEMBERS = [
  { id: 1, username: 'owner' },
  { id: 2, username: 'alice' },
  { id: 3, username: 'bob', avatar_url: '/uploads/avatars/bob.png' },
] as unknown as TripMember[];
const BAGS = [
  { id: 7, name: 'Carry-on', color: '#10b981' },
  { id: 8, name: 'Trolley', color: '#ec4899' },
] as unknown as PackingBag[];

function setup(overrides: Partial<Props> = {}) {
  const anchor = document.createElement('div');
  document.body.appendChild(anchor);
  const anchorRef = createRef<HTMLElement>() as { current: HTMLElement | null };
  anchorRef.current = anchor;
  const props: Props = {
    item: buildPackingItem({
      id: 1,
      name: 'Tent',
      category: 'Gear',
      quantity: 1,
      is_private: 0,
      owner_id: 1,
      owner_username: 'owner',
    } as Partial<PackingItem>),
    tripId: 1,
    anchorRef,
    onClose: vi.fn(),
    categories: ['Gear', 'Docs'],
    canEdit: true,
    bags: BAGS,
    onCreateBag: vi.fn(async () => undefined),
    tripMembers: MEMBERS,
    currentUserId: 1,
    onSetSharing: vi.fn(),
    onClone: vi.fn(),
    onJoin: vi.fn(),
    onLeave: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  const utils = render(<PackingItemDetail {...props} />);
  return { ...utils, props, dialog: within(screen.getByRole('dialog')) };
}

/** Captures the body of the next PUT to item 1. */
function capturePut() {
  const box: { body: Record<string, unknown> | null } = { body: null };
  server.use(
    http.put('/api/trips/1/packing/1', async ({ request }) => {
      box.body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ item: buildPackingItem({ id: 1 }) });
    })
  );
  return box;
}

beforeEach(() => {
  resetAllStores();
  toastError.mockClear();
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }), packingItems: [buildPackingItem({ id: 1, name: 'Tent' })] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PackingItemDetail — name and list', () => {
  it('FE-PACKDETAIL-001: renaming saves when the field lets go, Enter included', async () => {
    const put = capturePut();
    const { dialog } = setup();
    const input = dialog.getByRole('textbox', { name: 'Rename' });
    input.focus();
    fireEvent.change(input, { target: { value: 'Tarp' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(put.body).toMatchObject({ name: 'Tarp' }));
  });

  it('FE-PACKDETAIL-002: a blank or unchanged name saves nothing', async () => {
    const put = capturePut();
    const { dialog } = setup();
    const input = dialog.getByRole('textbox', { name: 'Rename' });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('Tent');
    fireEvent.blur(input);
    await new Promise((r) => setTimeout(r, 20));
    expect(put.body).toBeNull();
  });

  it('FE-PACKDETAIL-003: a failing save surfaces a save error', async () => {
    server.use(http.put('/api/trips/1/packing/1', () => new HttpResponse(null, { status: 500 })));
    const { dialog } = setup();
    const input = dialog.getByRole('textbox', { name: 'Rename' });
    fireEvent.change(input, { target: { value: 'Tarp' } });
    fireEvent.blur(input);
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to save'));
  });

  it('FE-PACKDETAIL-004: the List choice moves the item and leaves the current list alone', async () => {
    const put = capturePut();
    const { dialog } = setup();
    const choice = dialog.getByRole('button', { name: /Gear/ });
    expect(choice).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(choice);
    expect(choice).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(dialog.getAllByRole('button', { name: /Gear/ })[1]);
    expect(put.body).toBeNull();
    fireEvent.click(dialog.getByRole('button', { name: /Gear/ }));
    fireEvent.click(dialog.getByRole('button', { name: /Docs/ }));
    await waitFor(() => expect(put.body).toMatchObject({ category: 'Docs' }));
  });

  it('FE-PACKDETAIL-005: an item without a list sits in the default one', () => {
    const { dialog } = setup({ item: buildPackingItem({ id: 1, name: 'Tent', category: null }) });
    expect(dialog.getByRole('button', { name: /Other/ })).toBeInTheDocument();
  });
});

describe('PackingItemDetail — amounts', () => {
  it('FE-PACKDETAIL-006: the amount steps up and down and is typed into', async () => {
    const put = capturePut();
    const { dialog } = setup({ item: buildPackingItem({ id: 1, name: 'Socks', quantity: 3 }) });
    const group = within(dialog.getByRole('group', { name: 'Qty' }));
    fireEvent.click(group.getByRole('button', { name: 'One more' }));
    await waitFor(() => expect(put.body).toMatchObject({ quantity: 4 }));
    fireEvent.click(group.getByRole('button', { name: 'One less' }));
    await waitFor(() => expect(put.body).toMatchObject({ quantity: 2 }));
    const field = group.getByDisplayValue('3');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: '12' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    fireEvent.blur(field);
    await waitFor(() => expect(put.body).toMatchObject({ quantity: 12 }));
  });

  it('FE-PACKDETAIL-007: one piece cannot go lower, and a cleared field falls back to one', async () => {
    const put = capturePut();
    const { dialog } = setup();
    const group = within(dialog.getByRole('group', { name: 'Qty' }));
    expect(group.getByRole('button', { name: 'One less' })).toBeDisabled();
    const field = group.getByDisplayValue('1');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.blur(field);
    await new Promise((r) => setTimeout(r, 20));
    expect(put.body).toBeNull();
    expect(field).toHaveValue('1');
  });

  it('FE-PACKDETAIL-008: several pieces add the packed counter', () => {
    const { dialog } = setup({
      item: buildPackingItem({ id: 1, name: 'Socks', quantity: 5, packed_quantity: 2 } as Partial<PackingItem>),
    });
    expect(dialog.getByText('2/5')).toBeInTheDocument();
  });

  it('FE-PACKDETAIL-009: a single piece and a read-only window show no steppers', () => {
    const first = setup();
    expect(first.dialog.queryByText(/\/1$/)).toBeNull();
    first.unmount();
    const ro = setup({ canEdit: false });
    expect(ro.dialog.queryByRole('group', { name: 'Qty' })).toBeNull();
    expect(ro.dialog.getByRole('button', { name: /Gear/ })).toBeDisabled();
  });

  it('FE-PACKDETAIL-010: with bag tracking the weight is typed in grams', async () => {
    const put = capturePut();
    const { dialog } = setup({ bagTrackingEnabled: true });
    const weight = dialog.getByPlaceholderText('—');
    fireEvent.focus(weight);
    fireEvent.change(weight, { target: { value: '450' } });
    fireEvent.blur(weight);
    await waitFor(() => expect(put.body).toMatchObject({ weight_grams: 450 }));
  });
});

describe('PackingItemDetail — bag', () => {
  it('FE-PACKDETAIL-011: no bag tracking, no bag or weight lines', () => {
    const { dialog } = setup();
    expect(dialog.queryByPlaceholderText('—')).toBeNull();
    expect(dialog.queryByRole('button', { name: /Unassigned/ })).toBeNull();
  });

  it('FE-PACKDETAIL-012: picking a bag assigns it, picking the same one does nothing', async () => {
    const put = capturePut();
    const { dialog } = setup({ bagTrackingEnabled: true });
    fireEvent.click(dialog.getByRole('button', { name: /Unassigned/ }));
    fireEvent.click(dialog.getAllByRole('button', { name: /Unassigned/ })[1]);
    expect(put.body).toBeNull();
    fireEvent.click(dialog.getByRole('button', { name: /Unassigned/ }));
    fireEvent.click(dialog.getByRole('button', { name: /Trolley/ }));
    await waitFor(() => expect(put.body).toMatchObject({ bag_id: 8 }));
  });

  it('FE-PACKDETAIL-013: an assigned item can be taken out of its bag', async () => {
    const put = capturePut();
    const { dialog } = setup({
      bagTrackingEnabled: true,
      item: buildPackingItem({ id: 1, name: 'Tent', bag_id: 7 } as Partial<PackingItem>),
    });
    fireEvent.click(dialog.getByRole('button', { name: /Carry-on/ }));
    fireEvent.click(dialog.getByRole('button', { name: /Unassigned/ }));
    await waitFor(() => expect(put.body).toMatchObject({ bag_id: null }));
  });

  it('FE-PACKDETAIL-014: a new bag is created and assigned, a blank name creates nothing', async () => {
    const put = capturePut();
    const onCreateBag = vi.fn(async () => ({ id: 20, name: 'Daypack', color: '#6366f1' }) as unknown as PackingBag);
    const { dialog } = setup({ bagTrackingEnabled: true, onCreateBag });
    fireEvent.click(dialog.getByRole('button', { name: /Unassigned/ }));
    const field = dialog.getByRole('textbox', { name: 'Bag name...' });
    expect(dialog.getByRole('button', { name: 'Add bag' })).toBeDisabled();
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onCreateBag).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: 'Daypack' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Add bag' }));
    await waitFor(() => expect(put.body).toMatchObject({ bag_id: 20 }));
    expect(onCreateBag).toHaveBeenCalledWith('Daypack');
  });

  it('FE-PACKDETAIL-015: a bag that could not be created assigns nothing', async () => {
    const put = capturePut();
    const { dialog } = setup({ bagTrackingEnabled: true });
    fireEvent.click(dialog.getByRole('button', { name: /Unassigned/ }));
    const field = dialog.getByRole('textbox', { name: 'Bag name...' });
    fireEvent.change(field, { target: { value: 'Daypack' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    await waitFor(() => expect(dialog.queryByRole('textbox', { name: 'Bag name...' })).toBeNull());
    expect(put.body).toBeNull();
  });
});

describe('PackingItemDetail — who brings it and who sees it', () => {
  it('FE-PACKDETAIL-016: the bringer pill opens every traveller, ticked on or off (#3098)', () => {
    const { dialog, props } = setup({
      item: buildPackingItem({
        id: 1,
        name: 'Tent',
        is_private: 0,
        owner_id: 1,
        owner_username: 'owner',
        contributors: [{ user_id: 3, username: 'bob' }],
      } as unknown as Partial<PackingItem>),
    });
    fireEvent.click(dialog.getByRole('button', { name: /owner, bob/ }));
    fireEvent.click(dialog.getByRole('button', { name: 'alice' }));
    expect(props.onJoin).toHaveBeenCalledWith(1, 2);
    fireEvent.click(dialog.getByRole('button', { name: 'bob' }));
    expect(props.onLeave).toHaveBeenCalledWith(1, 3);
    fireEvent.click(dialog.getByRole('button', { name: 'owner' }));
    expect(props.onLeave).toHaveBeenCalledWith(1, 1);
  });

  it('FE-PACKDETAIL-017: nobody bringing it yet reads as such', () => {
    const { dialog } = setup({
      item: buildPackingItem({
        id: 1,
        name: 'Tent',
        is_private: 0,
        owner_id: null,
        owner_username: null,
      } as Partial<PackingItem>),
    });
    expect(dialog.getByRole('button', { name: /Nobody yet/ })).toBeInTheDocument();
  });

  it('FE-PACKDETAIL-018: the owner sets who sees the item', () => {
    const { dialog, props } = setup();
    const group = within(dialog.getByRole('radiogroup', { name: 'Visible to' }));
    expect(group.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(group.getByRole('radio', { name: 'Only me' }));
    expect(props.onSetSharing).toHaveBeenCalledWith(1, 'personal', []);
    fireEvent.click(group.getByRole('radio', { name: 'Selected' }));
    expect(group.getByRole('radio', { name: 'Selected' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(dialog.getByRole('button', { name: 'alice' }));
    expect(props.onSetSharing).toHaveBeenCalledWith(1, 'shared', [2]);
    fireEvent.click(group.getByRole('radio', { name: 'All' }));
    expect(props.onSetSharing).toHaveBeenLastCalledWith(1, 'common', []);
  });

  it('FE-PACKDETAIL-019: taking the last person off a shared item makes it personal', () => {
    const { dialog, props } = setup({
      item: buildPackingItem({
        id: 1,
        name: 'Diary',
        is_private: 1,
        owner_id: 1,
        recipients: [{ user_id: 2, username: 'alice' }],
      } as unknown as Partial<PackingItem>),
    });
    expect(dialog.getByRole('radio', { name: 'Selected' })).toHaveAttribute('aria-checked', 'true');
    // A private item has no bringer pill.
    expect(dialog.queryByRole('button', { name: /owner/ })).toBeNull();
    fireEvent.click(dialog.getByRole('button', { name: 'alice' }));
    expect(props.onSetSharing).toHaveBeenCalledWith(1, 'personal', []);
  });

  it('FE-PACKDETAIL-020: alone on the trip there is nobody to pick', () => {
    const { dialog } = setup({ tripMembers: [MEMBERS[0]] });
    fireEvent.click(dialog.getByRole('radio', { name: 'Selected' }));
    expect(dialog.getByText('No one else on this trip yet')).toBeInTheDocument();
  });

  it('FE-PACKDETAIL-021: an item someone else shared with me says whose it is and offers no sharing', () => {
    const { dialog } = setup({
      item: buildPackingItem({
        id: 1,
        name: 'Stove',
        is_private: 1,
        owner_id: 2,
        owner_username: 'alice',
      } as Partial<PackingItem>),
    });
    expect(dialog.getByText('by alice')).toBeInTheDocument();
    expect(dialog.queryByRole('radiogroup')).toBeNull();
    expect(dialog.queryByRole('button', { name: 'Copy to my list' })).toBeNull();
  });

  it('FE-PACKDETAIL-022: a common item of someone else can be copied to my list', () => {
    const { dialog, props } = setup({
      item: buildPackingItem({
        id: 1,
        name: 'Stove',
        is_private: 0,
        owner_id: 2,
        owner_username: 'alice',
      } as Partial<PackingItem>),
    });
    expect(dialog.queryByRole('radiogroup')).toBeNull();
    fireEvent.click(dialog.getByRole('button', { name: 'Copy to my list' }));
    expect(props.onClone).toHaveBeenCalledWith(1);
    expect(props.onClose).toHaveBeenCalled();
  });
});

describe('PackingItemDetail — closing and deleting', () => {
  it('FE-PACKDETAIL-023: Delete closes the window and hands over', () => {
    const { dialog, props } = setup();
    fireEvent.click(dialog.getByRole('button', { name: 'Delete' }));
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onDelete).toHaveBeenCalled();
  });

  it('FE-PACKDETAIL-024: Escape, the close button and a click beside the window close it', () => {
    const { dialog, props } = setup();
    fireEvent.keyDown(dialog.getByRole('textbox', { name: 'Rename' }), { key: 'Escape' });
    fireEvent.click(dialog.getByRole('button', { name: 'Close' }));
    fireEvent.click(document.querySelector('[role="presentation"]')!);
    expect(props.onClose).toHaveBeenCalledTimes(3);
  });
});
