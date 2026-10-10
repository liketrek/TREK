import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { journeyApi, mapsApi, weatherApi } from '../../api/client';
import { getCurrentPositionOnce } from '../../hooks/useGeolocation';
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage';
import { useTranslation } from '../../i18n';
import type { GalleryPhoto, JourneyEntry, JourneyPhoto, JourneyTrip } from '../../store/journeyStore';
import { getApiErrorMessage } from '../../types';
import { normalizeImageFiles } from '../../utils/convertHeic';
import { localIsoDate } from '../../utils/localDate';
import type { ResilientResult, UploadProgress } from '../../utils/uploadQueue';
import { useToast } from '../shared/Toast';
import type { ProviderPhotoGroup } from './JourneyDetailPageProviderPicker';
import { geoOnceErrorKey, isValidGeoPoint } from './journeyGeo';
import { journeyWeatherCategory } from './journeyWeather';
import { useEntryPhotoOrder } from './useEntryPhotoOrder';
import { useJourneyTripSuggestion } from './useJourneyTripSuggestion';

export type PendingProviderGroup = ProviderPhotoGroup & { provider: string };

export interface LocationResult {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface JourneyEntryFormOptions {
  entry: JourneyEntry;
  journeyId: number;
  trips: JourneyTrip[];
  galleryPhotos: GalleryPhoto[];
  onSave: (data: Record<string, unknown>, existingEntryId?: number) => Promise<number>;
  onUploadPhotos: (
    entryId: number,
    files: File[],
    cbs?: { onProgress?: (p: UploadProgress) => void }
  ) => Promise<ResilientResult<JourneyPhoto>>;
  onAddProviderPhotos?: (entryId: number, group: PendingProviderGroup) => Promise<void>;
  onDone: () => void;
  /** A viewer only reads the entry: no trip suggestion, no location probe. */
  readOnly?: boolean;
  /** Opened from quick capture: locate the traveller and fill in the place and the weather. */
  quickCapture?: boolean;
  /** Start an empty pros or cons list with one blank row to type into (the desktop dialog). */
  blankVerdictRow?: boolean;
  /** The form edits tags and a save sends them (the phone sheet). */
  withTags?: boolean;
  /** Moving the point alone, without renaming it, counts as an unsaved change (the desktop dialog). */
  dirtyOnCoordinates?: boolean;
  /** Show a failed "use my location" under the field (the phone sheet) instead of as a toast. */
  inlineLocateError?: boolean;
  /** Fill an empty weather field from the forecast once the place and day are known (the desktop dialog). */
  autoFillWeather?: boolean;
}

/** Joined non blank rows, the way a verdict list is compared with the saved one. */
const joinRows = (rows: string[]) => rows.filter((r) => r.trim()).join('\n');

/**
 * The journey entry form behind both the desktop editor dialog and the phone entry
 * sheet, which render their own markup over it: every field, the photo queue (uploads,
 * gallery links, provider photos) that only goes out on save, the location search and
 * "use my location", the verdict rows, and the save itself, which reuses the entry a
 * first save created when a later step of it fails (#1808).
 */
export function useJourneyEntryForm({
  entry,
  journeyId,
  trips,
  galleryPhotos,
  onSave,
  onUploadPhotos,
  onAddProviderPhotos,
  onDone,
  readOnly = false,
  quickCapture = false,
  blankVerdictRow = false,
  withTags = false,
  dirtyOnCoordinates = false,
  inlineLocateError = false,
  autoFillWeather = false,
}: JourneyEntryFormOptions) {
  const { t, language } = useTranslation();
  const placeLang = usePlaceLanguage();
  const toast = useToast();

  const initialRows = (rows: string[] | undefined) => (blankVerdictRow ? (rows?.length ? rows : ['']) : (rows ?? []));

  const [title, setTitle] = useState(entry.title || '');
  const [story, setStory] = useState(entry.story || '');
  const [entryDate, setEntryDate] = useState(entry.entry_date || localIsoDate());
  const [entryTime, setEntryTime] = useState(entry.entry_time?.slice(0, 5) || '');
  const [locationName, setLocationName] = useState(entry.location_name || '');
  const [locationLat, setLocationLat] = useState<number | null>(entry.location_lat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(entry.location_lng ?? null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mood, setMood] = useState(entry.mood || '');
  const [weather, setWeather] = useState(entry.weather || '');
  const [statsExcluded, setStatsExcluded] = useState(entry.stats_excluded ?? false);
  // The trip this day belongs to, when the journey does not follow it yet (#2265).
  const tripSuggestion = useJourneyTripSuggestion(
    journeyId,
    trips.map((tr) => tr.trip_id),
    entryDate,
    !readOnly
  );
  const [isDraft, setIsDraft] = useState(entry.is_draft ?? false);
  const [pros, setPros] = useState<string[]>(initialRows(entry.pros_cons?.pros));
  const [cons, setCons] = useState<string[]>(initialRows(entry.pros_cons?.cons));
  const [tags, setTags] = useState<string[]>(entry.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [photos, setPhotos] = useState<(JourneyPhoto | GalleryPhoto)[]>(entry.photos || []);
  // Drag a photo onto another's place, or send it to the front in one request (#824).
  const photoOrder = useEntryPhotoOrder(entry.id, photos, setPhotos);
  const canReorder = entry.id > 0 && photos.length > 1;
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // Minting the preview URL inline in the markup would hand out a fresh blob on
  // every keystroke in the story field and never give one back.
  const pendingPreviews = useMemo(() => pendingFiles.map((f) => URL.createObjectURL(f)), [pendingFiles]);
  useEffect(
    () => () => {
      pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [pendingPreviews]
  );
  const [pendingLinkIds, setPendingLinkIds] = useState<number[]>([]);
  const [pendingProviderGroups, setPendingProviderGroups] = useState<PendingProviderGroup[]>([]);
  const [showGalleryPick, setShowGalleryPick] = useState(false);
  // Which verdict row to put the caret in after the next render. Enter adds a row
  // and the caret has to follow it, or the key does half a job.
  const verdictFocusRef = useRef<string | null>(null);
  // A save that creates the entry and then fails on the photos keeps the form open;
  // without the id of what was just created, the retry would create a second entry (#1808).
  const persistedEntryIdRef = useRef<number | null>(entry.id > 0 ? entry.id : null);

  const isDirty =
    title !== (entry.title || '') ||
    story !== (entry.story || '') ||
    entryDate !== (entry.entry_date || localIsoDate()) ||
    entryTime !== (entry.entry_time?.slice(0, 5) || '') ||
    locationName !== (entry.location_name || '') ||
    (dirtyOnCoordinates &&
      ((locationLat ?? null) !== (entry.location_lat ?? null) ||
        (locationLng ?? null) !== (entry.location_lng ?? null))) ||
    mood !== (entry.mood || '') ||
    weather !== (entry.weather || '') ||
    statsExcluded !== (entry.stats_excluded ?? false) ||
    isDraft !== (entry.is_draft ?? false) ||
    joinRows(pros) !== (entry.pros_cons?.pros ?? []).join('\n') ||
    joinRows(cons) !== (entry.pros_cons?.cons ?? []).join('\n') ||
    (withTags && tags.join('\n') !== (entry.tags ?? []).join('\n')) ||
    pendingFiles.length > 0 ||
    pendingLinkIds.length > 0 ||
    pendingProviderGroups.length > 0;

  const availableGalleryPhotos = galleryPhotos.filter((gp) => !photos.some((p) => p.id === gp.id));
  const queuedProviderPhotos = pendingProviderGroups.reduce((sum, group) => sum + group.assetIds.length, 0);

  /** The provider assets already on the entry or queued for it, so the picker can mark them. */
  const providerAssetIds = (provider: string | null): Set<string> => {
    const ids = new Set<string>();
    if (!provider) return ids;
    photos.forEach((photo) => {
      if (photo.provider === provider && photo.asset_id) ids.add(photo.asset_id);
    });
    pendingProviderGroups.forEach((group) => {
      if (group.provider === provider) group.assetIds.forEach((assetId) => ids.add(assetId));
    });
    return ids;
  };

  const contextLocation = isValidGeoPoint({ lat: locationLat ?? Number.NaN, lng: locationLng ?? Number.NaN })
    ? { lat: locationLat!, lng: locationLng!, name: locationName || undefined }
    : null;

  // The route switch belongs to an entry that is a stop, or was one: an entry
  // without a point was never on the route, and a new one is not on it yet.
  const offersStatsToggle = entry.id > 0 && (contextLocation != null || !!entry.stats_excluded);

  // Quick capture locates the traveller once and names the spot and the weather there.
  useEffect(() => {
    if (!quickCapture || readOnly || entry.location_lat != null || entry.location_lng != null) return;

    let active = true;
    setLocating(true);
    getCurrentPositionOnce({ enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }).then(
      async (pos) => {
        if (!active) return;
        setLocationLat(pos.lat);
        setLocationLng(pos.lng);

        const [placeResult, weatherResult] = await Promise.allSettled([
          mapsApi.reverse(pos.lat, pos.lng, placeLang),
          weatherApi.getCurrent(pos.lat, pos.lng, language),
        ]);
        if (!active) return;
        if (placeResult.status === 'fulfilled') {
          setLocationName(placeResult.value.name || placeResult.value.address || '');
        }
        if (weatherResult.status === 'fulfilled' && !weatherResult.value.error) {
          setWeather(
            (current) => current || journeyWeatherCategory(weatherResult.value.main, weatherResult.value.description)
          );
        }
        setLocating(false);
      },
      (err) => {
        if (!active) return;
        setLocationError(t(geoOnceErrorKey(err)));
        setLocating(false);
      }
    );

    return () => {
      active = false;
    };
  }, [quickCapture, readOnly, entry.location_lat, entry.location_lng, entry.entry_date, t, language, placeLang]);

  /**
   * Fill the weather in from the forecast once the entry knows where and when. The
   * date decides the source on the server: today comes from the forecast, a backdated
   * day from the ERA5 archive, so writing up last Tuesday gets last Tuesday's weather.
   *
   * Only ever fills an empty field, and each place and day is tried once, so a cleared
   * icon stays cleared and a chosen one is never overwritten.
   */
  const weatherTriedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoFillWeather) return;
    if (typeof locationLat !== 'number' || typeof locationLng !== 'number') return;
    if (weather) return;
    const key = `${locationLat.toFixed(3)},${locationLng.toFixed(3)},${entryDate}`;
    if (weatherTriedRef.current === key) return;
    weatherTriedRef.current = key;

    let active = true;
    weatherApi
      .get(locationLat, locationLng, entryDate, language)
      .then((result) => {
        // An error shaped answer carries no `main`, and the dev only schema check
        // does not stop it reaching here in production.
        if (!active || !result || result.error || typeof result.main !== 'string') return;
        const category = journeyWeatherCategory(result.main, result.description ?? '');
        // Re-checked rather than trusted from the closure: the request is a
        // round trip and the traveller may have picked an icon while it was out.
        setWeather((current) => current || category);
      })
      .catch(() => {
        /* no weather is a fine outcome for a journal entry */
      });
    return () => {
      active = false;
    };
  }, [autoFillWeather, locationLat, locationLng, entryDate, weather, language]);

  /**
   * Enter in a pro or con opens the next one, directly below the one you are in, so a
   * list of short things needs no button press between every item (#2299).
   */
  const addVerdictRow = (list: 'pros' | 'cons', index: number) => {
    const [values, setValues] = list === 'pros' ? ([pros, setPros] as const) : ([cons, setCons] as const);
    const next = [...values];
    next.splice(index + 1, 0, '');
    setValues(next);
    verdictFocusRef.current = `${list}-${index + 1}`;
  };

  /** Give the caret to the row `addVerdictRow` just made, once React has drawn it. */
  const verdictRowRef = (key: string) => (el: HTMLInputElement | null) => {
    if (el && verdictFocusRef.current === key) {
      verdictFocusRef.current = null;
      el.focus();
    }
  };

  const addTag = () => {
    // Trailing commas dropped by a scan, not /,+$/: an unanchored ,+ before $ has to
    // retry from every comma in the run, so a pasted string of them freezes the tab.
    const trimmed = tagInput.trim();
    let end = trimmed.length;
    while (end > 0 && trimmed[end - 1] === ',') end--;
    const value = trimmed.slice(0, end);
    if (!value) return;
    if (!tags.includes(value)) setTags((prev) => [...prev, value]);
    setTagInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entryId = await onSave(
        {
          title: title || null,
          story: story || null,
          entry_date: entryDate,
          entry_time: entryTime || null,
          location_name: locationName || null,
          location_lat: locationLat,
          location_lng: locationLng,
          stats_excluded: offersStatsToggle ? statsExcluded : undefined,
          is_draft: isDraft,
          mood: mood || null,
          weather: weather || null,
          ...(withTags ? { tags: tags.filter((tag) => tag.trim()) } : {}),
          pros_cons: { pros: pros.filter((p) => p.trim()), cons: cons.filter((c) => c.trim()) },
          // An explicit Save is the user saying this suggestion is now their entry;
          // it does not need a story to earn that (#2008).
          type: entry.type === 'skeleton' ? 'entry' : undefined,
        },
        persistedEntryIdRef.current ?? undefined
      );
      if (entryId > 0) persistedEntryIdRef.current = entryId;
      // Upload the queued files once the entry exists.
      if (pendingFiles.length > 0 && entryId) {
        const toUpload = pendingFiles;
        setUploadProgress({ done: 0, total: toUpload.length });
        try {
          const { failed } = await onUploadPhotos(entryId, toUpload, {
            onProgress: (p) => setUploadProgress({ done: p.done, total: p.total }),
          });
          setPendingFiles(failed);
          if (failed.length > 0) {
            toast.error(
              t('journey.editor.uploadPartialFailed', { failed: String(failed.length), total: String(toUpload.length) })
            );
          }
        } catch (err) {
          toast.error(getApiErrorMessage(err, t('journey.editor.uploadFailed')));
        } finally {
          setUploadProgress(null);
        }
      }
      // Link the gallery photos picked before the save.
      if (pendingLinkIds.length > 0 && entryId) {
        for (const photoId of pendingLinkIds) {
          try {
            await journeyApi.linkPhoto(entryId, photoId);
          } catch {
            /* the linked photo stays in the gallery */
          }
        }
      }
      if (pendingProviderGroups.length > 0 && entryId && onAddProviderPhotos) {
        const failed: PendingProviderGroup[] = [];
        for (const group of pendingProviderGroups) {
          try {
            await onAddProviderPhotos(entryId, group);
          } catch {
            failed.push(group);
          }
        }
        if (failed.length > 0) {
          // Keep the form open with the failed groups queued so the next save
          // retries them instead of losing the selection.
          setPendingProviderGroups(failed);
          toast.error(
            t('journey.editor.externalPhotosPartialFailed', {
              failed: String(failed.length),
              total: String(pendingProviderGroups.length),
            })
          );
          return;
        }
        setPendingProviderGroups([]);
      }
      onDone();
    } catch (err) {
      // Neither the page callback nor journeyStore toasts, so without this the
      // whole entry just fails to save with no sign of it.
      toast.error(getApiErrorMessage(err, t('journey.settings.saveFailed')));
      return;
    } finally {
      setSaving(false);
    }
  };

  /** A gallery photo picked for the entry: linked at once to a saved entry, queued for a new one. */
  const pickGalleryPhoto = async (gp: GalleryPhoto) => {
    if (entry.id > 0) {
      try {
        const linked = await journeyApi.linkPhoto(entry.id, gp.id);
        if (linked) setPhotos((prev) => [...prev, linked]);
      } catch {
        /* keep the picker open on failure */
      }
    } else {
      setPendingLinkIds((prev) => [...prev, gp.id]);
      setPhotos((prev) => [...prev, gp]);
    }
  };

  /** A photo taken off the entry; its gallery row is kept. */
  const removePhoto = async (p: JourneyPhoto | GalleryPhoto) => {
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
    if (entry.id > 0) {
      try {
        await journeyApi.unlinkPhoto(entry.id, p.id);
      } catch {
        /* refreshed on the next load */
      }
    } else {
      setPendingLinkIds((prev) => prev.filter((id) => id !== p.id));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    // Queue files locally until Save so cancel and close actually discard.
    const normalized = await normalizeImageFiles(files);
    setPendingFiles((prev) => [...prev, ...normalized]);
  };

  const searchLocation = (query: string) => {
    setLocationQuery(query);
    setShowLocationResults(true);
    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    if (query.trim().length < 2) {
      setLocationResults([]);
      return;
    }
    locationTimerRef.current = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const res = await mapsApi.search(query, placeLang);
        setLocationResults(
          (res.places || [])
            .slice(0, 6)
            .map((p: { name: string; address?: string; lat: number | string; lng: number | string }) => ({
              name: p.name,
              address: p.address,
              lat: Number(p.lat),
              lng: Number(p.lng),
            }))
        );
      } catch {
        setLocationResults([]);
      } finally {
        setLocationSearching(false);
      }
    }, 400);
  };

  const pickLocation = (r: LocationResult) => {
    setLocationName(r.name);
    setLocationLat(r.lat);
    setLocationLng(r.lng);
    setLocationQuery('');
    setShowLocationResults(false);
    setLocationResults([]);
  };

  const handleUseCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    if (inlineLocateError) setLocationError('');
    try {
      const pos = await getCurrentPositionOnce();
      // Fill coordinates right away; the name is refined below once the
      // reverse geocode comes back.
      const fallbackName = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
      if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
      setLocationSearching(false);
      setLocationLat(pos.lat);
      setLocationLng(pos.lng);
      setLocationName(fallbackName);
      setLocationQuery('');
      setLocationResults([]);
      setShowLocationResults(false);
      try {
        const data = await mapsApi.reverse(pos.lat, pos.lng, placeLang);
        const name = data.name || data.address;
        // Only replace the coordinate fallback; don't clobber a search result
        // the user may have picked while the reverse call was in flight.
        if (name) setLocationName((prev) => (prev === fallbackName ? name : prev));
      } catch {
        /* best effort: keep the coordinate fallback */
      }
    } catch (err) {
      if (inlineLocateError) setLocationError(t(geoOnceErrorKey(err)));
      else toast.error(t(geoOnceErrorKey(err)));
    } finally {
      setLocating(false);
    }
  };

  return {
    title,
    setTitle,
    story,
    setStory,
    entryDate,
    setEntryDate,
    entryTime,
    setEntryTime,
    locationName,
    locationLat,
    locationLng,
    locationQuery,
    locationResults,
    locationSearching,
    showLocationResults,
    setShowLocationResults,
    locating,
    locationError,
    mood,
    setMood,
    weather,
    setWeather,
    statsExcluded,
    setStatsExcluded,
    tripSuggestion,
    isDraft,
    setIsDraft,
    pros,
    setPros,
    cons,
    setCons,
    tags,
    setTags,
    tagInput,
    setTagInput,
    saving,
    uploadProgress,
    photos,
    photoOrder,
    canReorder,
    pendingFiles,
    setPendingFiles,
    pendingPreviews,
    pendingProviderGroups,
    setPendingProviderGroups,
    showGalleryPick,
    setShowGalleryPick,
    isDirty,
    availableGalleryPhotos,
    queuedProviderPhotos,
    providerAssetIds,
    contextLocation,
    offersStatsToggle,
    addVerdictRow,
    verdictRowRef,
    addTag,
    handleSave,
    handleFileChange,
    pickGalleryPhoto,
    removePhoto,
    searchLocation,
    pickLocation,
    handleUseCurrentLocation,
  };
}
