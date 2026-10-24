import { describe, expect, it } from 'vitest';
import {
  loadTrackMarks,
  markTrackMarksSaved,
  pickOnTrack,
  refuseTrackPick,
  startTrackPick,
  trackMarkEdits,
  useTrackMarkToolStore,
} from '../store/trackMarkToolStore';
import {
  NO_TRACK_MARKS,
  projectOntoTrack,
  splitTrackByPortages,
  withLock,
  withLockTimes,
  withoutPortage,
  withPortage,
  withPortageExtra,
} from './paddleTrackMarks';

/** A straight track east along 53°N, one point per kilometre (near enough). */
const TRACK: [number, number][] = [0, 1, 2, 3, 4].map((km) => [53, 13 + km / 66.9]);

describe('paddle track marks (PAD-03 on a recorded track)', () => {
  it('snaps a click to its distance along the track and says how far off the line it was', () => {
    const on = projectOntoTrack(TRACK, { lat: 53, lng: 13 + 1.5 / 66.9 });
    expect(on?.atM).toBeGreaterThan(1450);
    expect(on?.atM).toBeLessThan(1550);
    expect(on?.offM).toBeLessThan(1);
    const off = projectOntoTrack(TRACK, { lat: 53.01, lng: 13 + 2 / 66.9 });
    expect(off?.offM).toBeGreaterThan(1000);
    expect(projectOntoTrack([[53, 13]], { lat: 53, lng: 13 })).toBeNull();
  });

  it('adds locks in order and portages from either end, never one over another', () => {
    const locked = withLock(withLock(NO_TRACK_MARKS, 3000), 1000);
    expect(locked.locks.map((lock) => lock.at_m)).toEqual([1000, 3000]);
    const one = withPortage(NO_TRACK_MARKS, 900, 400);
    expect(one.portages).toEqual([{ from_m: 400, to_m: 900, extra_minutes: null }]);
    expect(withPortage(one, 800, 1200)).toBe(one);
    expect(withPortage(one, 500, 500)).toBe(one);
    const two = withPortage(one, 2000, 1500);
    expect(two.portages.map((p) => p.from_m)).toEqual([400, 1500]);
  });

  it('changes and removes what is marked', () => {
    const marks = withLock(withPortage(NO_TRACK_MARKS, 100, 300), 2000);
    expect(withPortageExtra(marks, 0, 20).portages[0].extra_minutes).toBe(20);
    expect(withoutPortage(marks, 0).portages).toEqual([]);
    expect(withLockTimes(marks, 0, { wait_minutes: 5, transit_minutes: 10 }).locks[0]).toMatchObject({
      at_m: 2000,
      wait_minutes: 5,
    });
    expect(withLockTimes(marks, 0, null).locks).toEqual([]);
  });

  it('cuts the track where a portage starts and ends, the parts meeting exactly', () => {
    const parts = splitTrackByPortages(TRACK, [{ from_m: 1500, to_m: 2500, extra_minutes: null }]);
    expect(parts.map((part) => part.land)).toEqual([false, true, false]);
    expect(parts[0].coordinates[parts[0].coordinates.length - 1]).toEqual(parts[1].coordinates[0]);
    expect(parts[1].coordinates[parts[1].coordinates.length - 1]).toEqual(parts[2].coordinates[0]);
    expect(splitTrackByPortages(TRACK, [])).toHaveLength(1);
  });
});

describe('trackMarkToolStore', () => {
  it('marks a lock with one click and a portage with two, then turns the tool off', () => {
    loadTrackMarks(7, null, { paddle: null, portage: null });
    startTrackPick('lock');
    pickOnTrack(1200);
    expect(useTrackMarkToolStore.getState()).toMatchObject({ pick: null, dirty: true });
    startTrackPick('portage');
    pickOnTrack(400);
    expect(useTrackMarkToolStore.getState().pendingFromM).toBe(400);
    pickOnTrack(800);
    const state = useTrackMarkToolStore.getState();
    expect(state.marks.portages).toEqual([{ from_m: 400, to_m: 800, extra_minutes: null }]);
    expect(state.marks.locks.map((lock) => lock.at_m)).toEqual([1200]);
  });

  it('says why a click placed nothing: off the line, or on a portage already there', () => {
    loadTrackMarks(
      7,
      { portages: [{ from_m: 100, to_m: 500, extra_minutes: null }], locks: [] },
      { paddle: null, portage: null }
    );
    startTrackPick('portage');
    refuseTrackPick();
    expect(useTrackMarkToolStore.getState().refused).toBe('off_line');
    pickOnTrack(200);
    pickOnTrack(700);
    expect(useTrackMarkToolStore.getState().refused).toBe('overlap');
    expect(useTrackMarkToolStore.getState().marks.portages).toHaveLength(1);
  });

  it('keeps edits until saved, and a save leaves the marks as the server has them', () => {
    loadTrackMarks(7, null, { paddle: null, portage: null });
    trackMarkEdits.setSpeeds({ portage: 3 });
    expect(useTrackMarkToolStore.getState()).toMatchObject({ dirty: true, speeds: { portage: 3 } });
    pickOnTrack(100);
    expect(useTrackMarkToolStore.getState().marks.locks).toEqual([]);
    markTrackMarksSaved(null, { paddle: 4, portage: 3 });
    expect(useTrackMarkToolStore.getState()).toMatchObject({ dirty: false, marks: NO_TRACK_MARKS });
  });
});
