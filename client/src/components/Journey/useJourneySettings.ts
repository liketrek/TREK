import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { journeyApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useJourneyStore, type JourneyContributor, type JourneyDetail } from '../../store/journeyStore';
import { normalizeImageFile } from '../../utils/convertHeic';
import { useToast } from '../shared/Toast';

export type JourneyEntryField = 'show_verdict' | 'show_mood' | 'show_weather';
export type JourneyStatusChoice = 'auto' | 'draft' | 'live' | 'completed';

export interface AvailableTrip {
  id: number;
  title: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
}

export interface JourneySettingsOptions {
  journey: JourneyDetail;
  /** Saved: the shell closes and reloads. */
  onSaved: () => void;
  /** Reload without closing, so a half typed title survives a switch being flipped. */
  onRefresh: () => void;
  /**
   * Called once a new cover or an unlinked trip went through: the desktop dialog
   * passes onSaved (it closes), the phone sheet onRefresh (it stays open).
   */
  onContentChanged: () => void;
}

/**
 * A journey's settings, behind both the desktop dialog and the phone sheet, which render
 * their own markup over it: name and subtitle, cover, the switches that are saved on the
 * spot (trip tracks, the optional entry fields, photo locations, the status shown),
 * archive, delete, unlinking a trip and removing a contributor.
 */
export function useJourneySettings({ journey, onSaved, onRefresh, onContentChanged }: JourneySettingsOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { updateJourney, deleteJourney } = useJourneyStore();

  const [title, setTitle] = useState(journey.title);
  const [subtitle, setSubtitle] = useState(journey.subtitle || '');
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ trip_id: number; title: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingTracks, setSavingTracks] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savingPhotoLocation, setSavingPhotoLocation] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const isDirty = title !== journey.title || subtitle !== (journey.subtitle || '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateJourney(journey.id, { title, subtitle: subtitle || null });
      onSaved();
    } catch {
      toast.error(t('journey.settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('cover', await normalizeImageFile(file));
    try {
      await journeyApi.uploadCover(journey.id, formData);
      toast.success(t('journey.settings.coverUpdated'));
      onContentChanged();
    } catch {
      toast.error(t('journey.settings.coverFailed'));
    }
  };

  const handleArchiveToggle = async () => {
    setArchiving(true);
    try {
      const newStatus = journey.status === 'archived' ? 'active' : 'archived';
      await updateJourney(journey.id, { status: newStatus });
      toast.success(newStatus === 'archived' ? t('journey.settings.archived') : t('journey.settings.reopened'));
      onSaved();
    } catch {
      toast.error(t('journey.settings.saveFailed'));
    } finally {
      setArchiving(false);
    }
  };

  // The switches below are saved on the spot rather than on Save, like the archive
  // button: they are view settings, and the point of them is seeing the journey change
  // (#2194). Through onRefresh, not onSaved: onSaved closes the shell the moment a
  // switch is flipped and would drop a title the owner has typed but not saved yet.
  // Nothing an entry field stored is erased when it is switched off (#2299): the form
  // stops asking, the values stay, and switching back on brings them into view.

  /** `next` is the switch's new value; without one the current value flips. */
  const handleTracksToggle = async (next: boolean = !journey.show_trip_tracks) => {
    setSavingTracks(true);
    try {
      await updateJourney(journey.id, { show_trip_tracks: next });
      onRefresh();
    } catch {
      toast.error(t('journey.settings.saveFailed'));
    } finally {
      setSavingTracks(false);
    }
  };

  /** `next` is the switch's new value; without one the current value flips. */
  const handleFieldToggle = async (field: JourneyEntryField, next: boolean = journey[field] === 0) => {
    setSavingField(field);
    try {
      await updateJourney(journey.id, { [field]: next });
      onRefresh();
    } catch {
      toast.error(t('journey.settings.saveFailed'));
    } finally {
      setSavingField(null);
    }
  };

  // Entries placed from their photos (#1003).
  const handlePhotoLocationToggle = async () => {
    setSavingPhotoLocation(true);
    try {
      await updateJourney(journey.id, { photo_location: !journey.photo_location });
      onRefresh();
    } catch {
      toast.error(t('journey.settings.saveFailed'));
    } finally {
      setSavingPhotoLocation(false);
    }
  };

  // The state shown for the journey, set by hand (#762); 'auto' stores null and hands
  // it back to the trip dates.
  const statusChoice: JourneyStatusChoice = journey.status_override ?? 'auto';
  const handleStatusChange = async (next: JourneyStatusChoice) => {
    if (next === statusChoice || savingStatus) return;
    setSavingStatus(true);
    try {
      await updateJourney(journey.id, { status_override: next === 'auto' ? null : next });
      onRefresh();
    } catch {
      toast.error(t('journey.settings.saveFailed'));
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJourney(journey.id);
      navigate('/journey');
    } catch {
      toast.error(t('journey.settings.failedToDelete'));
    }
  };

  const handleRemoveContributor = async (c: JourneyContributor) => {
    if (!window.confirm(t('journey.contributors.removeConfirm', { username: c.username }))) return;
    try {
      await journeyApi.removeContributor(journey.id, c.user_id);
      toast.success(t('journey.contributors.removed'));
      onRefresh();
    } catch {
      toast.error(t('journey.contributors.removeFailed'));
    }
  };

  const confirmUnlink = async () => {
    if (!unlinkTarget) return;
    try {
      await journeyApi.removeTrip(journey.id, unlinkTarget.trip_id);
      toast.success(t('journey.trips.tripUnlinked'));
      setUnlinkTarget(null);
      onContentChanged();
    } catch {
      toast.error(t('journey.trips.unlinkFailed'));
    }
  };

  return {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    saving,
    isDirty,
    archiving,
    unlinkTarget,
    setUnlinkTarget,
    showDeleteConfirm,
    setShowDeleteConfirm,
    savingTracks,
    savingField,
    savingPhotoLocation,
    savingStatus,
    statusChoice,
    handleSave,
    handleCoverUpload,
    handleArchiveToggle,
    handleTracksToggle,
    handleFieldToggle,
    handlePhotoLocationToggle,
    handleStatusChange,
    handleDelete,
    handleRemoveContributor,
    confirmUnlink,
  };
}

export interface JourneyTripLinkingOptions {
  journeyId: number;
  /** Called after a trip was linked (and its toast shown). */
  onLinked: () => void;
  /** Load the linkable trips as soon as the picker mounts (the desktop dialog). */
  loadOnMount?: boolean;
}

/**
 * Linking another trip to a journey, behind the desktop add trip dialog and the phone
 * settings sheet: the trips the user could link, and the link itself.
 */
export function useJourneyTripLinking({ journeyId, onLinked, loadOnMount = false }: JourneyTripLinkingOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [availableTrips, setAvailableTrips] = useState<AvailableTrip[]>([]);
  const [linkingTripId, setLinkingTripId] = useState<number | null>(null);

  useEffect(() => {
    if (!loadOnMount) return;
    journeyApi
      .availableTrips()
      .then((d) => setAvailableTrips(d.trips || []))
      .catch(() => {});
  }, [loadOnMount]);

  const loadAvailableTrips = async () => {
    try {
      const data = await journeyApi.availableTrips();
      setAvailableTrips(data.trips || []);
    } catch {
      /* the list stays empty */
    }
  };

  const linkTrip = async (tripId: number) => {
    setLinkingTripId(tripId);
    try {
      await journeyApi.addTrip(journeyId, tripId);
      toast.success(t('journey.trips.tripLinked'));
      onLinked();
    } catch {
      toast.error(t('journey.trips.linkFailed'));
    } finally {
      setLinkingTripId(null);
    }
  };

  return { availableTrips, linkingTripId, loadAvailableTrips, linkTrip };
}
