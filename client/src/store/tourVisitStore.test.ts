// CW-03: the visits store of the city walks: read per trip, marked at once on
// screen, kept current by the trip's socket.
import type { TourVisit } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addListener, removeListener } from '../api/websocket';
import { tourVisitRepo } from '../repo/tourVisitRepo';
import type { WebSocketEvent } from '../types';
import { useAddonStore } from './addonStore';
import { reloadTourVisits, useTourVisitStore, watchTourVisits } from './tourVisitStore';

const visit = (assignment_id: number, station_key: string, status: TourVisit['status']): TourVisit => ({
  assignment_id,
  station_key,
  status,
});

/** A promise and the function that settles it, for an answer that comes later. */
function later<T>() {
  let settle: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

beforeEach(() => {
  useTourVisitStore.setState({ tripId: null, byAssignment: {} });
  vi.mocked(addListener).mockClear();
  vi.mocked(removeListener).mockClear();
});

afterEach(() => vi.restoreAllMocks());

describe('tourVisitStore', () => {
  it('load groups the visits by day and stop, and reset forgets them', async () => {
    vi.spyOn(tourVisitRepo, 'list').mockResolvedValue({
      visits: [visit(9, 'stop-01', 'visited'), visit(9, 'stop-02', 'skipped'), visit(10, 'stop-01', 'visited')],
    });

    await useTourVisitStore.getState().load(4);

    expect(useTourVisitStore.getState()).toMatchObject({
      tripId: '4',
      byAssignment: { 9: { 'stop-01': 'visited', 'stop-02': 'skipped' }, 10: { 'stop-01': 'visited' } },
    });
    useTourVisitStore.getState().reset(5);
    expect(useTourVisitStore.getState()).toMatchObject({ tripId: '5', byAssignment: {} });
  });

  it("another trip's visits go at once, and its load answering late changes nothing", async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-01': 'visited' } } });
    const first = later<{ visits: TourVisit[] }>();
    vi.spyOn(tourVisitRepo, 'list')
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ visits: [visit(30, 'stop-01', 'skipped')] });

    const left = useTourVisitStore.getState().load(5);
    expect(useTourVisitStore.getState()).toMatchObject({ tripId: '5', byAssignment: {} });
    await useTourVisitStore.getState().load(6);
    first.settle({ visits: [visit(20, 'stop-01', 'visited')] });
    await left;

    expect(useTourVisitStore.getState()).toMatchObject({ tripId: '6', byAssignment: { 30: { 'stop-01': 'skipped' } } });
  });

  it("mark shows the stop at once and then takes the day's answer; a take back drops the stop", async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-02': 'visited' } } });
    const answer = later<{ visits: TourVisit[] }>();
    const update = vi.spyOn(tourVisitRepo, 'update').mockReturnValueOnce(answer.promise);

    const marking = useTourVisitStore.getState().mark(4, 9, 'stop-01', 'skipped');
    expect(useTourVisitStore.getState().byAssignment[9]).toEqual({ 'stop-02': 'visited', 'stop-01': 'skipped' });
    answer.settle({ visits: [visit(9, 'stop-01', 'skipped'), visit(9, 'stop-03', 'visited')] });
    await marking;

    expect(update).toHaveBeenCalledWith(4, 9, 'stop-01', { status: 'skipped' });
    expect(useTourVisitStore.getState().byAssignment[9]).toEqual({ 'stop-01': 'skipped', 'stop-03': 'visited' });
    update.mockResolvedValueOnce({ visits: [] });
    const takingBack = useTourVisitStore.getState().mark(4, 9, 'stop-01', 'planned');
    expect(useTourVisitStore.getState().byAssignment[9]).toEqual({ 'stop-03': 'visited' });
    await takingBack;
  });

  it('a refused mark puts the day back as it was, or empty, and throws', async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-02': 'visited' } } });
    const refused = new Error('No permission');
    vi.spyOn(tourVisitRepo, 'update').mockRejectedValue(refused);

    await expect(useTourVisitStore.getState().mark(4, 9, 'stop-01', 'visited')).rejects.toBe(refused);
    await expect(useTourVisitStore.getState().mark(4, 10, 'stop-01', 'visited')).rejects.toBe(refused);

    expect(useTourVisitStore.getState().byAssignment).toEqual({ 9: { 'stop-02': 'visited' }, 10: {} });
  });

  it('applyRemote replaces only that day', () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-02': 'visited' }, 10: { a: 'skipped' } } });

    useTourVisitStore.getState().applyRemote(9, [visit(9, 'stop-05', 'visited')]);

    expect(useTourVisitStore.getState().byAssignment).toEqual({ 9: { 'stop-05': 'visited' }, 10: { a: 'skipped' } });
  });

  it("receive keeps this device's waiting marks on top, and the server's list when they cannot be read", async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: {} });
    const received = vi
      .spyOn(tourVisitRepo, 'received')
      .mockResolvedValueOnce({ visits: [visit(9, 'stop-01', 'skipped')] })
      .mockRejectedValueOnce(new Error('Queue not readable'));

    await useTourVisitStore.getState().receive(4, 9, [visit(9, 'stop-01', 'visited')]);
    expect(received).toHaveBeenCalledWith(4, 9, [visit(9, 'stop-01', 'visited')]);
    expect(useTourVisitStore.getState().byAssignment[9]).toEqual({ 'stop-01': 'skipped' });

    await useTourVisitStore.getState().receive(4, 10, [visit(10, 'stop-02', 'visited')]);
    expect(useTourVisitStore.getState().byAssignment[10]).toEqual({ 'stop-02': 'visited' });
  });

  it('receive for a trip left meanwhile changes nothing', async () => {
    useTourVisitStore.setState({ tripId: '5', byAssignment: {} });
    vi.spyOn(tourVisitRepo, 'received').mockResolvedValue({ visits: [visit(9, 'stop-01', 'visited')] });

    await useTourVisitStore.getState().receive(4, 9, [visit(9, 'stop-01', 'visited')]);

    expect(useTourVisitStore.getState().byAssignment).toEqual({});
  });
});

describe('reloadTourVisits', () => {
  const toursOn = (enabled: boolean) =>
    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: 'map', enabled }] });

  beforeEach(() => toursOn(true));
  afterEach(() => useAddonStore.setState({ addons: [] }));

  it("reads the open trip's visits again, so a mark the server no longer has leaves", async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'gone-01': 'visited', 'stop-02': 'skipped' } } });
    const list = vi.spyOn(tourVisitRepo, 'list').mockResolvedValue({ visits: [visit(9, 'stop-02', 'skipped')] });

    reloadTourVisits(4);

    await vi.waitFor(() => expect(useTourVisitStore.getState().byAssignment).toEqual({ 9: { 'stop-02': 'skipped' } }));
    expect(list).toHaveBeenCalledExactlyOnceWith(4);
  });

  it('leaves the visits of another trip alone, and every trip while Tours is off', () => {
    const list = vi.spyOn(tourVisitRepo, 'list');
    useTourVisitStore.setState({ tripId: '5', byAssignment: { 9: { 'stop-01': 'visited' } } });

    reloadTourVisits(4);
    toursOn(false);
    reloadTourVisits(5);

    expect(list).not.toHaveBeenCalled();
    expect(useTourVisitStore.getState()).toMatchObject({ tripId: '5', byAssignment: { 9: { 'stop-01': 'visited' } } });
  });

  it('a read that fails shows no progress, unless another trip was opened meanwhile', async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-01': 'visited' } } });
    const refused = later<{ visits: TourVisit[] }>();
    const list = vi.spyOn(tourVisitRepo, 'list').mockRejectedValueOnce(new Error('No permission'));

    reloadTourVisits(4);
    await vi.waitFor(() => expect(useTourVisitStore.getState()).toMatchObject({ tripId: '4', byAssignment: {} }));

    useTourVisitStore.setState({ byAssignment: { 9: { 'stop-01': 'visited' } } });
    list
      .mockImplementationOnce(() => refused.promise.then(() => Promise.reject(new Error('Gone'))))
      .mockResolvedValueOnce({ visits: [visit(30, 'stop-01', 'skipped')] });
    reloadTourVisits(4);
    await useTourVisitStore.getState().load(6);
    refused.settle({ visits: [] });
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(3));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(useTourVisitStore.getState()).toMatchObject({ tripId: '6', byAssignment: { 30: { 'stop-01': 'skipped' } } });
  });
});

describe('watchTourVisits', () => {
  function listener(): (event: WebSocketEvent) => void {
    const calls = vi.mocked(addListener).mock.calls;
    return calls[calls.length - 1][0];
  }

  it("applies the trip's visits that read as visits, and ignores everything else", async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-02': 'visited' }, 11: { a: 'skipped' } } });
    const received = vi
      .spyOn(tourVisitRepo, 'received')
      .mockImplementation(async (_trip, _day, visits) => ({ visits: [...visits] }));
    const stop = watchTourVisits(4);
    const onEvent = listener();

    onEvent({ type: 'tours:visits', tripId: 5, assignmentId: 9, visits: [] });
    onEvent({ type: 'tours:changed', tripId: 4, assignmentId: 9, visits: [] });
    onEvent({ type: 'tours:visits', tripId: 4, assignmentId: 9, visits: 'none' });
    onEvent({ type: 'tours:visits', tripId: 4, assignmentId: '9', visits: [] });
    onEvent({ type: 'tours:visits', tripId: 4, assignmentId: -9, visits: [] });
    onEvent({ type: 'tours:visits', tripId: 4, assignmentId: 9.5, visits: [] });
    onEvent({ type: 'tours:visits', tripId: 4, visits: [] });
    expect(received).not.toHaveBeenCalled();

    onEvent({
      type: 'tours:visits',
      tripId: '4',
      assignmentId: 9,
      visits: [visit(9, 'stop-01', 'visited'), { assignment_id: 9, station_key: 'x', status: 'visited' }, null],
    });
    await vi.waitFor(() =>
      expect(useTourVisitStore.getState().byAssignment).toEqual({ 9: { 'stop-01': 'visited' }, 11: { a: 'skipped' } })
    );
    expect(received).toHaveBeenCalledWith(4, 9, [visit(9, 'stop-01', 'visited')]);

    stop();
    expect(removeListener).toHaveBeenCalledWith(onEvent);
  });
});
