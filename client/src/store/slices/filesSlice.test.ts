// FE-STORE-FILES-001 to FE-STORE-FILES-010
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildTripFile } from '../../../tests/helpers/factories';
import { useTripStore } from '../tripStore';
import { clearAll, offlineDb } from '../../db/offlineDb';

/**
 * unlinkFileFromReservation (#2084): a file can sit on a booking two ways, through
 * its own reservation_id (uploaded there) or through a link row (linked later).
 * Taking it off has to undo whichever applies and keep the file itself.
 */
describe('filesSlice.unlinkFileFromReservation', () => {
  let calls: string[];
  let reloads: number;

  /** The server side of one unlink, recording what the store sent in which order. */
  function serve(links: { id: number; reservation_id: number | null }[] | undefined, fileId = 7) {
    server.use(
      http.put(`/api/trips/1/files/${fileId}`, async ({ request }) => {
        calls.push(`PUT ${JSON.stringify(await request.json())}`);
        return HttpResponse.json({ file: buildTripFile({ id: fileId }) });
      }),
      http.get(`/api/trips/1/files/${fileId}/links`, () => {
        calls.push('GET links');
        return HttpResponse.json(links === undefined ? {} : { links });
      }),
      http.delete(`/api/trips/1/files/${fileId}/link/:linkId`, ({ params }) => {
        calls.push(`DELETE link ${String(params.linkId)}`);
        return HttpResponse.json({ success: true });
      }),
    );
  }

  beforeEach(() => {
    resetAllStores();
    calls = [];
    reloads = 0;
    const reloaded = buildTripFile({ id: 99, trip_id: 1, original_name: 'reloaded.pdf' });
    server.use(
      http.get('/api/trips/1/files', () => {
        reloads += 1;
        return HttpResponse.json({ files: [reloaded] });
      }),
    );
  });

  it('FE-STORE-FILES-001: a file uploaded on the booking loses its reservation_id and any link row to it', async () => {
    serve([{ id: 3, reservation_id: 9 }, { id: 4, reservation_id: 10 }]);
    const file = buildTripFile({ id: 7, trip_id: 1, reservation_id: 9 });

    await useTripStore.getState().unlinkFileFromReservation(1, file, 9);

    // Only the link row of this booking goes; the other booking keeps its link.
    expect(calls).toEqual(['PUT {"reservation_id":null}', 'GET links', 'DELETE link 3']);
    expect(reloads).toBe(1);
    expect(useTripStore.getState().files.map(f => f.id)).toEqual([99]);
  });

  it('FE-STORE-FILES-002: a file linked later keeps its own reservation_id and loses only the link row', async () => {
    serve([{ id: 5, reservation_id: 9 }]);
    const file = buildTripFile({ id: 7, trip_id: 1, reservation_id: 10, linked_reservation_ids: [9] });

    await useTripStore.getState().unlinkFileFromReservation(1, file, 9);

    expect(calls).toEqual(['GET links', 'DELETE link 5']);
    expect(reloads).toBe(1);
  });

  it('FE-STORE-FILES-003: without a link row for the booking nothing is deleted, and an answer without links reads as none', async () => {
    serve(undefined);
    const file = buildTripFile({ id: 7, trip_id: 1, reservation_id: 9 });

    await useTripStore.getState().unlinkFileFromReservation(1, file, 9);

    expect(calls).toEqual(['PUT {"reservation_id":null}', 'GET links']);
    expect(reloads).toBe(1);
  });

  it('FE-STORE-FILES-004: a link row of another booking is left alone', async () => {
    serve([{ id: 6, reservation_id: 11 }]);
    await useTripStore.getState().unlinkFileFromReservation(1, buildTripFile({ id: 7, trip_id: 1 }), 9);
    expect(calls).toEqual(['GET links']);
  });

  it('FE-STORE-FILES-005: a refused write throws the server message and still reloads the files', async () => {
    serve([]);
    server.use(http.put('/api/trips/1/files/7', () => HttpResponse.json({ error: 'Not allowed' }, { status: 403 })));
    const file = buildTripFile({ id: 7, trip_id: 1, reservation_id: 9 });

    await expect(useTripStore.getState().unlinkFileFromReservation(1, file, 9)).rejects.toThrow('Not allowed');

    // The link rows are not touched after the first write failed.
    expect(calls).toEqual([]);
    expect(reloads).toBe(1);
  });

  it('FE-STORE-FILES-006: a failure without a server message falls back to the generic one', async () => {
    serve([]);
    server.use(http.get('/api/trips/1/files/7/links', () => HttpResponse.json({}, { status: 500 })));

    await expect(
      useTripStore.getState().unlinkFileFromReservation(1, buildTripFile({ id: 7, trip_id: 1 }), 9),
    ).rejects.toThrow('Error unlinking file');
    expect(reloads).toBe(1);
  });

  it('FE-STORE-FILES-007: a failing link delete is rethrown too', async () => {
    serve([{ id: 8, reservation_id: 9 }]);
    server.use(http.delete('/api/trips/1/files/7/link/8', () => HttpResponse.json({ error: 'Link locked' }, { status: 409 })));
    seedStore(useTripStore, { files: [buildTripFile({ id: 7, trip_id: 1 })] });

    await expect(
      useTripStore.getState().unlinkFileFromReservation(1, buildTripFile({ id: 7, trip_id: 1 }), 9),
    ).rejects.toThrow('Link locked');
    // The reload in finally replaced the list all the same.
    expect(useTripStore.getState().files.map(f => f.id)).toEqual([99]);
  });
});

/**
 * Offline (#2601): a file moved to the trash or taken off a booking waits in the
 * queue instead of failing, and an upload says it needs a connection.
 */
describe('filesSlice offline', () => {
  function setOnline(v: boolean): void {
    Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
  }

  beforeEach(async () => {
    resetAllStores();
    await clearAll();
    setOnline(false);
  });

  afterEach(() => {
    setOnline(true);
  });

  it('FE-STORE-FILES-008: a file moved to the trash offline leaves the list and its DELETE waits', async () => {
    seedStore(useTripStore, { files: [buildTripFile({ id: 7, trip_id: 1 }), buildTripFile({ id: 8, trip_id: 1 })] });

    await useTripStore.getState().deleteFile(1, 7);

    expect(useTripStore.getState().files.map((f) => f.id)).toEqual([8]);
    const [mutation] = await offlineDb.mutationQueue.toArray();
    expect(mutation).toMatchObject({ method: 'DELETE', url: '/trips/1/files/7' });
  });

  it('FE-STORE-FILES-009: a file uploaded on the booking comes off it offline without asking for its link rows', async () => {
    const file = buildTripFile({ id: 7, trip_id: 1, reservation_id: 9, linked_reservation_ids: [] });
    await offlineDb.tripFiles.put(file);

    await useTripStore.getState().unlinkFileFromReservation(1, file, 9);

    const [mutation] = await offlineDb.mutationQueue.toArray();
    expect(mutation).toMatchObject({ method: 'PUT', url: '/trips/1/files/7', body: { reservation_id: null } });
    expect(useTripStore.getState().files).toEqual([expect.objectContaining({ id: 7, reservation_id: null })]);
  });

  it('FE-STORE-FILES-010: an upload offline throws the hint key and keeps the list', async () => {
    seedStore(useTripStore, { files: [buildTripFile({ id: 7, trip_id: 1 })] });

    await expect(useTripStore.getState().addFile(1, new FormData())).rejects.toThrow('files.uploadNeedsConnection');

    expect(useTripStore.getState().files.map((f) => f.id)).toEqual([7]);
  });
});
