import { create } from 'zustand';
import { hasNativeFeature, loadNativeCapabilities } from './capabilities';
import { reportNativeFailure } from './reportFailure';
import { TrekShell, isUnimplemented, type SharedFilePayload } from './trekShell';

/**
 * Booking documents shared to TREK ("Open in TREK" on a PDF, a calendar entry,
 * a Wallet pass or a mail). The native side hands them over as base64
 * (TrekShell.takeSharedFile and the sharedFile event); here they become a File
 * waiting for a trip: NativeImportSheet asks which one, and the trip's booking
 * import opens with the file already chosen (BookingImportModal).
 */
interface SharedImportState {
  file: File | null;
  /** The trip the user picked for it; the planner of that trip takes it from here. */
  tripId: number | null;
  setFile: (file: File | null) => void;
  chooseTrip: (tripId: number) => void;
  /** The booking import took the file: the queue is empty again. */
  take: () => File | null;
}

export const useSharedImportStore = create<SharedImportState>((set, get) => ({
  file: null,
  tripId: null,
  setFile: (file) => set({ file, tripId: null }),
  chooseTrip: (tripId) => set({ tripId }),
  take: () => {
    const { file } = get();
    set({ file: null, tripId: null });
    return file;
  },
}));

export function toFile(payload: SharedFilePayload): File {
  const binary = atob(payload.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], payload.name || 'booking', { type: payload.mimeType || 'application/octet-stream' });
}

/** Picks up a document shared before the UI ran, and listens for the next ones. */
export async function startSharedFiles(): Promise<void> {
  await loadNativeCapabilities();
  if (!hasNativeFeature('sharedFiles')) return;
  const accept = (payload: SharedFilePayload | null) => {
    if (!payload?.data) return;
    const store = useSharedImportStore.getState();
    store.setFile(toFile(payload));
    // The share sheet asked for the trip already; NativeImportSheet opens it.
    if (typeof payload.tripId === 'number') store.chooseTrip(payload.tripId);
  };
  void TrekShell.addListener('sharedFile', accept);
  try {
    accept((await TrekShell.takeSharedFile()).file);
  } catch (err) {
    if (!isUnimplemented(err)) reportNativeFailure(err);
  }
}
