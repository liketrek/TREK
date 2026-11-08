import { create } from 'zustand';
import { collabApi } from '../api/client';
import { hasNativeFeature, loadNativeCapabilities } from './capabilities';
import { reportNativeFailure } from './reportFailure';
import { TrekShell, isUnimplemented, type SharedFilePayload } from './trekShell';

/**
 * What was shared to TREK: a booking document ("Open in TREK" on a PDF, a
 * calendar entry, a Wallet pass or a mail), or a web page or link. The native
 * side hands it over as base64 (TrekShell.takeSharedFile and the sharedFile
 * event); here it becomes a File waiting for a trip: NativeImportSheet asks
 * which one, and the trip's booking import opens with the file already chosen
 * (BookingImportModal). A page or a link also carries its address, and the
 * sheet asks first whether it goes to the trip's links or is read as a booking.
 */

/** A shared page or link, which can be kept among a trip's links. */
export interface SharedLink {
  url: string;
  title: string;
  /** The trip the share sheet picked for it, held back until it is clear what to do with the link. */
  presetTripId: number | null;
}

interface SharedImportState {
  file: File | null;
  /** The trip whose booking import takes the file; the planner of that trip takes it from here. */
  tripId: number | null;
  link: SharedLink | null;
  setFile: (file: File | null, link?: SharedLink | null) => void;
  chooseTrip: (tripId: number) => void;
  /** The booking import took the file: the queue is empty again. */
  take: () => File | null;
}

export const useSharedImportStore = create<SharedImportState>((set, get) => ({
  file: null,
  tripId: null,
  link: null,
  setFile: (file, link = null) => set({ file, tripId: null, link: file ? link : null }),
  chooseTrip: (tripId) => set({ tripId }),
  take: () => {
    const { file } = get();
    set({ file: null, tripId: null, link: null });
    return file;
  },
}));

export function toFile(payload: SharedFilePayload): File {
  const binary = atob(payload.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], payload.name || 'booking', { type: payload.mimeType || 'application/octet-stream' });
}

/** The link a payload carries: an http(s) address only, titled by the page or its host. */
export function linkOf(payload: SharedFilePayload): SharedLink | null {
  const raw = payload.url?.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const title = payload.title?.trim() || url.host;
  return {
    url: url.href,
    title: title.slice(0, 200),
    presetTripId: typeof payload.tripId === 'number' ? payload.tripId : null,
  };
}

/**
 * Keeps a shared link among the trip's links (Collaboration, Links), titled as
 * the page is. Online only, like adding a link in the app: the caller says so
 * when it fails. The trip's other members get it live over the WebSocket.
 */
export async function saveSharedLink(tripId: number, link: SharedLink): Promise<void> {
  await collabApi.createLink(tripId, { title: link.title, url: link.url });
}

/** Picks up a document shared before the UI ran, and listens for the next ones. */
export async function startSharedFiles(): Promise<void> {
  await loadNativeCapabilities();
  if (!hasNativeFeature('sharedFiles')) return;
  const accept = (payload: SharedFilePayload | null) => {
    if (!payload?.data) return;
    const store = useSharedImportStore.getState();
    const link = linkOf(payload);
    store.setFile(toFile(payload), link);
    // The share sheet asked for the trip already; NativeImportSheet opens it. A link
    // keeps that trip in hand instead, until the sheet knows what to do with it.
    if (!link && typeof payload.tripId === 'number') store.chooseTrip(payload.tripId);
  };
  void TrekShell.addListener('sharedFile', accept);
  try {
    accept((await TrekShell.takeSharedFile()).file);
  } catch (err) {
    if (!isUnimplemented(err)) reportNativeFailure(err);
  }
}
