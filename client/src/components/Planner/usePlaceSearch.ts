import type { MapsResolveUrlResult } from '@trek/shared';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mapsApi } from '../../api/client';
import { recordPlacePick } from '../../api/placeShadow';
import { pointFromBox, type LocationBiasBox } from '../../hooks/useLocationBias';
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage';
import { usePlaceSuggestions } from '../../hooks/usePlaceSuggestions';
import type { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { corePickRank, selectGoogleHoldsSlot } from '../../utils/placeSource';
import { PlacesSession } from '../../utils/placesSession';
import type { useToast } from '../shared/Toast';
import { isMapUrl, parseCoordinatePair } from './PlaceFormModal.helpers';

/** A place as a provider hands it back: loosely typed, kept open by design. */
export type MapsPlace = Record<string, unknown>;

/** A row of a full or nearby search, read the way both lists render it. */
export type MapsSearchRow = MapsPlace & { name?: string; address?: string; distance_m?: number };

/**
 * One row of the typed-ahead list, as the server sends it.
 *
 * `source`, `lat` and `lng` are optional because not every index fills them:
 * Google answers with neither, and the mark falls back to the name the whole
 * list carries. `place` is only on a plugin's row, which brings its whole place
 * along because no details lookup knows a plugin id (#2221).
 */
export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  source?: string;
  lat?: number;
  lng?: number;
  place?: MapsPlace;
}

/** Where a pick sat in a ranked list, for the shadow log. */
export interface PlaceSearchPick {
  mode: 'search' | 'autocomplete';
  rank: number;
  count: number;
}

export interface PlaceSearchOptions {
  /**
   * The two shells search a little differently, and each keeps its own way.
   *
   * `dialog` (desktop): the search button and the keys clear the typed-ahead list
   * themselves, failures are logged to the console and an aborted keystroke leaves its
   * list alone, a query cut below two characters ends the billing session, a full search
   * leaves the session open, and a resolved map link clears the result list as well.
   *
   * `sheet` (phone): a typed "lat, lng" pair is a position rather than a query, so it
   * gets no suggestions and the search button takes it as the coordinates; every full
   * search ends the billing session, and a pick clears the typed-ahead list too.
   */
  variant: 'dialog' | 'sheet';
  /** Where the trip is happening: autocomplete is biased to the box, the full search to its centre. */
  locationBias: LocationBiasBox | undefined;
  t: ReturnType<typeof useTranslation>['t'];
  toast: ReturnType<typeof useToast>;
  /**
   * The desktop dialog stays mounted while it is closed, so each closing ends what the
   * search held: the query, its lists, a request still on its way. The phone's sheet
   * unmounts instead and passes nothing.
   */
  open?: boolean;
  /** A place picked from a list or found for a suggestion; `label` names the index it came from. */
  onPlace: (place: MapsPlace, label: string | null) => void;
  /** A suggestion was clicked: its name goes into the form while its place is looked up. */
  onSuggestionName: (name: string) => void;
  /** A pasted Google Maps or Amap link the server turned into a position. */
  onMapLink: (resolved: MapsResolveUrlResult) => void;
  /** A typed coordinate pair, taken as the position itself (the phone). */
  onCoordinates?: (lat: string, lng: string) => void;
  /** True while a search or a pick is being looked up. */
  onResolvingChange?: (resolving: boolean) => void;
}

/**
 * The maps search of the place form: the one logic path behind the desktop dialog's
 * search block and the phone sheet's search row, which render their own markup over it.
 * Typed-ahead suggestions (debounced, the stale request aborted, one Google billing
 * session per search), a full search biased to the trip, a pasted map link resolved into
 * a position, places near the pin, and picking a row, which hands the place to the form
 * and records the pick for the shadow log.
 */
export function usePlaceSearch({
  variant,
  locationBias,
  t,
  toast,
  open,
  onPlace,
  onSuggestionName,
  onMapLink,
  onCoordinates,
  onResolvingChange,
}: PlaceSearchOptions) {
  const sheet = variant === 'sheet';
  // Place names in the language the user picked for them, the app's otherwise (#1799).
  const language = usePlaceLanguage();
  const googleAnswers = useAuthStore(selectGoogleHoldsSlot);
  const { autocomplete, sourceLabel } = usePlaceSuggestions();
  // The same hint autocomplete gets, as a point instead of a box.
  const biasPoint = pointFromBox(locationBias);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapsSearchRow[]>([]);
  /** What answered the last full search. Only a fallback: a merged list carries the source per place. */
  const [searchSource, setSearchSource] = useState('');
  // The list on screen answers "what is near the pin" rather than a typed query (#976).
  const [nearbyList, setNearbyList] = useState(false);
  // The query the last full search found nothing for (#2472): the cue to add the
  // place by hand instead of a silent empty list.
  const [emptySearch, setEmptySearch] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  // Which index answered the last keystroke, for the rows that do not say so
  // themselves. Google and the OpenStreetMap fallback each answer from one
  // place; the index path answers from two at once and marks every row.
  const [acSource, setAcSource] = useState('');
  const [highlight, setHighlight] = useState(-1);
  /**
   * What produced the list currently on screen, kept for the shadow log: the
   * query as typed and the provider the envelope named. A ref rather than
   * state because nothing renders from it and a pick must read the value that
   * belonged to the list, not a value a re-render replaced.
   */
  const searchMetaRef = useRef<{ query: string; source: string } | null>(null);
  const acMetaRef = useRef<{ query: string; source: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Counts the closings of the dialog, so an answer still on its way when it
  // closed can tell that the opening it was asked for is over. A counter rather
  // than an abort, because the full search takes no signal.
  const epochRef = useRef(0);
  // Ties one search's keystrokes and its details lookup into a single Google
  // billing session (see utils/placesSession).
  const sessionRef = useRef(new PlacesSession());

  const setBusy = (busy: boolean) => {
    setSearching(busy);
    onResolvingChange?.(busy);
  };

  // Everything the search block holds would otherwise greet the next opening:
  // the last query, its list, the Google line offering that list's query again,
  // suggestions still on their way. A pick from that list writes over the place
  // being edited, whichever place that is by then.
  useEffect(() => {
    if (open !== false) return;
    epochRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    sessionRef.current.end();
    searchMetaRef.current = null;
    acMetaRef.current = null;
    setQuery('');
    setResults([]);
    setSearchSource('');
    setSuggestions([]);
    setAcSource('');
    setHighlight(-1);
    setSearching(false);
  }, [open]);

  // Autocomplete fetch: aborts any in-flight request before starting a new one.
  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (input.length < 2 || isMapUrl(input)) {
        setSuggestions([]);
        setHighlight(-1);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const result = await autocomplete(
          input,
          language,
          locationBias,
          controller.signal,
          sessionRef.current.current()
        );
        acMetaRef.current = { query: input, source: result.source || 'unknown' };
        setSuggestions(result.suggestions || []);
        setAcSource(result.source || '');
        setHighlight(-1);
      } catch (err: unknown) {
        if (!sheet && err instanceof Error && err.name === 'AbortError') return;
        // Superseded request: axios rejects an aborted call with CanceledError.
        if (err instanceof Error && err.name === 'CanceledError') return;
        if (!sheet) console.error('Autocomplete failed:', err);
        setSuggestions([]);
      }
    },
    [autocomplete, language, locationBias, sheet]
  );

  // Debounced autocomplete, watching only the query. Map links go to the search
  // button, and so do coordinate pairs on the phone.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2 || isMapUrl(trimmed) || (sheet && parseCoordinatePair(trimmed) !== null)) {
      // A list still on its way belongs to a query that is gone.
      abortRef.current?.abort();
      setSuggestions([]);
      if (!sheet) {
        setHighlight(-1);
        sessionRef.current.end();
      }
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions, sheet]);

  /** Hands a place to the form, logs where it was picked, and clears what led to it. */
  const take = (place: MapsPlace, pick: PlaceSearchPick | undefined, label: string | null) => {
    onPlace(place, label);
    // `pick` is present only when the place came out of a ranked list. The
    // collection picker, a coordinate pair and a resolved link reach the form
    // with a place that was never ranked against a query, and a made-up rank
    // would be worse than no row at all.
    if (pick) {
      const meta = pick.mode === 'search' ? searchMetaRef.current : acMetaRef.current;
      const lat = Number(place.lat);
      const lng = Number(place.lng);
      if (meta && Number.isFinite(lat) && Number.isFinite(lng)) {
        recordPlacePick({
          query: meta.query,
          lang: language,
          // The bias the search actually ran under is a box around the trip's
          // existing places; the corpus stores its centre, which is what an
          // evaluation needs to bias its own index the same way.
          biasLat: locationBias ? (locationBias.low.lat + locationBias.high.lat) / 2 : undefined,
          biasLng: locationBias ? (locationBias.low.lng + locationBias.high.lng) / 2 : undefined,
          source: `${pick.mode}:${meta.source}`,
          liveRank: pick.rank,
          liveCount: pick.count,
          pickedName: sheet ? String(place.name ?? '') : (place.name as string) || '',
          pickedLat: lat,
          pickedLng: lng,
          pickedPlaceId:
            (place.google_place_id as string) || (place.amap_poi_id as string) || (place.osm_id as string) || null,
        });
      }
    }
    setResults([]);
    if (sheet) setSuggestions([]);
    setQuery('');
  };

  /** A row of a list, or a place from elsewhere (the saved-place picker) when `pick` is absent. */
  const pickPlace = (place: MapsPlace, pick?: PlaceSearchPick) =>
    take(place, pick, sourceLabel(place, pick?.mode === 'search' ? searchSource : ''));

  const runSearch = async (provider?: 'google') => {
    // The retry sends the query the list came from, not the field: the list
    // stays on screen while the field is edited or cleared, and the line under
    // it promises the same query.
    const trimmed = provider ? (searchMetaRef.current?.query ?? '') : query.trim();
    if (!trimmed) return;
    if (sheet) {
      setSuggestions([]);
      // "lat, lng" typed or pasted: straight to coordinates, no lookup needed.
      const pair = parseCoordinatePair(trimmed);
      if (pair) {
        onCoordinates?.(pair[0], pair[1]);
        setQuery('');
        return;
      }
    }
    const epoch = epochRef.current;
    setBusy(true);
    try {
      // A pasted Google Maps or Amap link resolves server-side into a place
      if (!provider && isMapUrl(trimmed)) {
        const resolved = await mapsApi.resolveUrl(trimmed);
        if (epoch !== epochRef.current) return;
        if (resolved.lat && resolved.lng) {
          onMapLink(resolved);
          if (!sheet) setResults([]);
          setQuery('');
          toast.success(t('places.urlResolved'));
          return;
        }
      }
      const result = await mapsApi.search(trimmed, language, biasPoint, provider);
      if (epoch !== epochRef.current) return;
      searchMetaRef.current = { query: trimmed, source: result.source || 'unknown' };
      const places = (result.places || []) as MapsSearchRow[];
      if (!sheet) setNearbyList(false);
      setResults(places);
      if (!sheet) setEmptySearch(places.length === 0 ? trimmed : null);
      setSearchSource(result.source || '');
    } catch (err: unknown) {
      if (epoch !== epochRef.current) return;
      toast.error(getApiErrorMessage(err, t('places.mapsSearchError')));
    } finally {
      if (epoch === epochRef.current) setBusy(false);
      if (sheet) sessionRef.current.end();
    }
  };

  // What is around the pin the form holds (#976): the list a search would show,
  // nearest first. Not logged as a search pick, because no query was typed.
  const searchNearby = async (pin: { lat: number; lng: number } | null) => {
    if (!pin) return;
    const epoch = epochRef.current;
    setBusy(true);
    setSuggestions([]);
    try {
      const result = await mapsApi.nearby(pin.lat, pin.lng, language);
      if (epoch !== epochRef.current) return;
      searchMetaRef.current = null;
      setNearbyList(true);
      setResults((result.places || []) as MapsSearchRow[]);
      setSearchSource(result.source || '');
      if (!result.places?.length) toast.info(t('places.nearbyNone'));
    } catch (err: unknown) {
      if (epoch !== epochRef.current) return;
      toast.error(getApiErrorMessage(err, t('places.mapsSearchError')));
    } finally {
      if (epoch === epochRef.current) setBusy(false);
    }
  };

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    // Read before the list is cleared: this is the rank the user saw.
    const acPick = corePickRank(suggestions, suggestion);
    abortRef.current?.abort();
    setSuggestions([]);
    setHighlight(-1);
    const previousQuery = query;
    const epoch = epochRef.current;
    setQuery('');
    onSuggestionName(suggestion.mainText);
    setBusy(true);
    try {
      // The details lookup is a fragile second hop: it can fail when the
      // details kill-switch is off, when the OSM Overpass mirror is overloaded,
      // or on any upstream error. Treat a missing/coordinate-less place as a
      // miss and fall back to the reliable text-search path the search button
      // uses (its results already carry coordinates), so dropdown items stay
      // clickable instead of dead-ending on "Place search failed". (#1192)
      let place: MapsPlace | null = suggestion.place ?? null;
      if (!place) {
        try {
          // Spends the session the suggestions opened, so Google bills the search
          // once rather than per keystroke.
          const result = await mapsApi.details(suggestion.placeId, language, sessionRef.current.peek());
          if (result.place && result.place.lat != null && result.place.lng != null) place = result.place;
        } catch (err) {
          if (!sheet) console.error('Failed to fetch place details:', err);
        }
      }
      // Closed while the details were on their way: the pick belongs to an
      // opening that is over, and the fallback search below is not worth a
      // request nobody will see.
      if (epoch !== epochRef.current) return;
      if (!place && suggestion.source === 'openstreetmap' && suggestion.lat != null && suggestion.lng != null) {
        // The layer's rows carry no address; their second line is the name
        // written on the building. Searching for "Tokio Hauptbahnhof, 東京駅"
        // is not a question anybody asked, and its first answer would be
        // whatever the index made of it: a different place, chosen silently.
        // The suggestion already knows where it is, so use that.
        place = {
          name: suggestion.mainText,
          address: '',
          lat: suggestion.lat,
          lng: suggestion.lng,
          osm_id: suggestion.placeId,
          source: 'openstreetmap',
        };
      }
      if (!place) {
        const fullQuery = [suggestion.mainText, suggestion.secondaryText].filter(Boolean).join(', ');
        const search = await mapsApi.search(fullQuery, language, biasPoint);
        if (epoch !== epochRef.current) return;
        place = search.places?.[0] ?? null;
      }
      if (place) {
        // Named after the row that was clicked, whatever the lookup behind it answered from.
        take(place, acPick && { mode: 'autocomplete', ...acPick }, sourceLabel(suggestion, acSource));
      } else {
        setQuery(previousQuery);
        toast.error(t('places.mapsSearchError'));
      }
    } catch (err) {
      if (epoch !== epochRef.current) return;
      if (!sheet) console.error('Place suggestion lookup failed:', err);
      setQuery(previousQuery);
      toast.error(getApiErrorMessage(err, t('places.mapsSearchError')));
    } finally {
      // Closing already ended this session; ending it again here would cut off
      // the one a new opening may have started meanwhile.
      if (epoch === epochRef.current) {
        setBusy(false);
        sessionRef.current.end();
      }
    }
  };

  /** The desktop field's keys: arrows walk the typed-ahead list, Enter picks or searches, Escape closes the list. */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlight >= 0) {
          void selectSuggestion(suggestions[highlight]);
        } else {
          setSuggestions([]);
          void runSearch();
        }
      } else if (e.key === 'Escape') {
        // Spent on the list: the dialog leaves an Escape that was already
        // handled alone, so only the next one closes it.
        e.preventDefault();
        setSuggestions([]);
        setHighlight(-1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch();
    }
  };

  return {
    language,
    googleAnswers,
    sourceLabel,
    query,
    setQuery,
    results,
    searchSource,
    nearbyList,
    emptySearch,
    setEmptySearch,
    searching,
    suggestions,
    setSuggestions,
    acSource,
    highlight,
    setHighlight,
    fetchSuggestions,
    runSearch,
    searchNearby,
    pickPlace,
    selectSuggestion,
    handleKeyDown,
  };
}
