import { BookOpen, Calendar, Check, ChevronRight, MapPin, Plus, Search, Sparkles, X } from 'lucide-react';
import { useId, type Dispatch, type SetStateAction } from 'react';
import HelpAnchor from '../components/Help/HelpAnchor';
import PageShell from '../components/Layout/PageShell';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../components/shared/DialogShell';
import { EditorField, INPUT } from '../components/shared/dialogParts';
import { TransHtml, useTranslation } from '../i18n';
import type { Journey } from '../store/journeyStore';
import { computeJourneyLifecycle } from '../utils/journeyLifecycle';
import { localIsoDate } from '../utils/localDate';
import { useJourney } from './journey/useJourney';

const GRADIENTS = [
  'linear-gradient(135deg, #0F172A 0%, #6366F1 45%, #EC4899 100%)',
  'linear-gradient(135deg, #1E293B 0%, #7C3AED 50%, #F59E0B 100%)',
  'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
  'linear-gradient(135deg, #2D1B69 0%, #11998E 100%)',
  'linear-gradient(135deg, #4B134F 0%, #C94B4B 100%)',
  'linear-gradient(135deg, #373B44 0%, #4286F4 100%)',
];

function pickGradient(id: number): string {
  return GRADIENTS[id % GRADIENTS.length];
}

export default function JourneyPage() {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return (
    <>
      <HelpAnchor id="journey" />
      <JourneyPageDesktop />
    </>
  );
}

function JourneyPageDesktop() {
  const { t } = useTranslation();
  // Page = wiring container: store load, create modal, search + suggestions in the hook.
  const {
    navigate,
    journeys,
    loading,
    showCreate,
    setShowCreate,
    newTitle,
    setNewTitle,
    newSubtitle,
    setNewSubtitle,
    availableTrips,
    selectedTripIds,
    setSelectedTripIds,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    activeSuggestion,
    setDismissedSuggestions,
    activeJourney,
    activeJourneyIsLive,
    filteredJourneys,
    openCreateModal,
    handleCreate,
    totalPlaces,
  } = useJourney();

  return (
    <PageShell background="var(--vg-bg)" navOffset="var(--nav-h, 56px)">
      <div className="mx-auto max-w-[1800px]">
        {/* Header — mobile */}
        <div className="flex flex-col gap-2 px-5 pb-4 pt-5 md:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (searchOpen) {
                  setSearchOpen(false);
                  setSearchQuery('');
                } else {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              {searchOpen ? <X size={15} /> : <Search size={15} />}
            </button>
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-[14px] font-semibold text-white transition-transform active:scale-[0.98] dark:bg-white dark:text-zinc-900"
            >
              <Plus size={16} strokeWidth={2.5} />
              {t('journey.frontpage.createJourney')}
            </button>
          </div>
          {searchOpen && (
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                  setSearchOpen(false);
                }
              }}
              placeholder={t('journey.search.placeholder')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[14px] text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          )}
        </div>

        <div className="px-4 pb-16 pt-10 md:px-8">
          {/* Suggestion banner */}
          {activeSuggestion && (
            <div
              className="relative mb-8 overflow-hidden rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)' }}
            >
              <div
                className="pointer-events-none absolute inset-0 hidden md:block"
                style={{
                  background:
                    'radial-gradient(circle at 85% 50%, rgba(99,102,241,0.4), transparent 50%), radial-gradient(circle at 100% 100%, rgba(236,72,153,0.3), transparent 50%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 md:hidden"
                style={{
                  background:
                    'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.5), transparent 60%), radial-gradient(circle at 20% 90%, rgba(236,72,153,0.35), transparent 60%)',
                }}
              />
              <div className="relative flex flex-col justify-between gap-4 p-5 text-white md:flex-row md:items-center md:gap-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-white/15 backdrop-blur">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70">
                      {t('journey.frontpage.suggestionLabel')}
                    </div>
                    <div className="mt-0.5 text-[13px]">
                      <TransHtml html="journey.frontpage.suggestionText" params={{ title: activeSuggestion.title }} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDismissedSuggestions((prev) => new Set([...prev, activeSuggestion.id]))}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-white/20"
                  >
                    {t('journey.frontpage.dismiss')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateModal(activeSuggestion.id)}
                    className="rounded-lg !bg-white px-3 py-1.5 text-[12px] font-medium !text-zinc-900 hover:!bg-zinc-100"
                  >
                    {t('journey.frontpage.createJourney')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Journey Hero */}
          {activeJourney && (
            <div className="mb-10">
              <button
                type="button"
                onClick={() => navigate(`/journey/${activeJourney.id}`)}
                className="relative block h-[250px] w-full cursor-pointer overflow-hidden rounded-[28px] text-left shadow-[0_2px_4px_rgba(0,0,0,0.06),0_20px_48px_-18px_rgba(0,0,0,0.32)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 md:h-[280px]"
                style={{
                  background: activeJourney.cover_image
                    ? `linear-gradient(120deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.05) 100%), url(/uploads/${activeJourney.cover_image}) center/cover`
                    : pickGradient(activeJourney.id),
                  willChange: 'transform',
                }}
              >
                {/* Left-fading glass blur — promoted to its own layer so the hover
                      transform on the parent doesn't drop the mask for a frame. */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backdropFilter: 'blur(7px)',
                    WebkitBackdropFilter: 'blur(7px)',
                    maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.82) 22%, rgba(0,0,0,0) 62%)',
                    WebkitMaskImage:
                      'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.82) 22%, rgba(0,0,0,0) 62%)',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                  }}
                />

                <div className="absolute inset-0 flex flex-col text-white" style={{ padding: '30px 34px 34px' }}>
                  <div className="mt-auto">
                    {/* Eyebrow */}
                    <div className="mb-2.5">
                      <span
                        style={{
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.2em',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {activeJourneyIsLive
                          ? t('journey.frontpage.activeJourney')
                          : t('journey.frontpage.latestJourney')}
                      </span>
                    </div>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: 'clamp(34px, 5vw, 52px)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                        textShadow: '0 2px 14px rgba(0,0,0,0.4)',
                      }}
                    >
                      {activeJourney.title}
                    </h2>

                    {activeJourney.subtitle && (
                      <div
                        className="mt-3 max-w-[560px]"
                        style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}
                      >
                        {activeJourney.subtitle}
                      </div>
                    )}

                    {/* Stats + continue */}
                    <div className="mt-[22px] flex items-center gap-5">
                      <div
                        className="flex items-center"
                        style={{
                          gap: 40,
                          padding: '14px 28px',
                          borderRadius: 16,
                          background: 'rgba(255,255,255,0.14)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {[
                          { val: (activeJourney as any).entry_count ?? '--', label: t('journey.stats.entries') },
                          { val: (activeJourney as any).photo_count ?? '--', label: t('journey.stats.photos') },
                          { val: (activeJourney as any).place_count ?? '--', label: t('journey.stats.places') },
                        ].map((s) => (
                          <div key={s.label} className="flex flex-col gap-1">
                            <span
                              style={{
                                fontFamily: 'var(--font-subtext)',
                                fontSize: 20,
                                fontWeight: 700,
                                lineHeight: 1,
                              }}
                            >
                              {s.val}
                            </span>
                            <span
                              className="font-semibold uppercase"
                              style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.75)' }}
                            >
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <span
                        className="ml-auto hidden items-center gap-2 md:inline-flex"
                        style={{
                          padding: '13px 22px',
                          borderRadius: 14,
                          background: '#fff',
                          color: '#101013',
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {t('journey.frontpage.continueWriting')}
                        <ChevronRight size={16} strokeWidth={2.4} />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Search results info */}
          {searchQuery.trim() && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[13px] text-zinc-500">
                {filteredJourneys.length === 0
                  ? t('journey.search.noResults', { query: searchQuery.trim() })
                  : `${filteredJourneys.length} ${t('journey.frontpage.journeys')}`}
              </span>
            </div>
          )}

          {/* All Journeys */}
          {!searchQuery.trim() && (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--vg-ink3)' }}>
                {t('journey.frontpage.allJourneys')}
              </span>
            </div>
          )}

          {loading && journeys.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-[18px] lg:grid-cols-3 xl:grid-cols-4">
              {filteredJourneys.map((j) => (
                <JourneyCard key={j.id} journey={j} onClick={() => navigate(`/journey/${j.id}`)} />
              ))}

              {/* Create card */}
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="group flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1"
                style={{ border: '1.5px dashed var(--vg-line2)', background: 'var(--vg-surf2)' }}
              >
                <span
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-90"
                  style={{ background: 'var(--vg-ink)', color: 'var(--vg-bg)' }}
                >
                  <Plus size={22} strokeWidth={2.4} />
                </span>
                <div className="text-center">
                  <div className="text-[16px] font-semibold" style={{ color: 'var(--vg-ink)' }}>
                    {t('journey.frontpage.createNew')}
                  </div>
                  <div
                    className="mt-[3px] max-w-[200px] text-[12.5px] leading-snug"
                    style={{ color: 'var(--vg-ink3)' }}
                  >
                    {t('journey.frontpage.createNewSub')}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateJourneyDialog
          title={newTitle}
          onTitleChange={setNewTitle}
          subtitle={newSubtitle}
          onSubtitleChange={setNewSubtitle}
          trips={availableTrips}
          selectedTripIds={selectedTripIds}
          onSelectedTripIdsChange={setSelectedTripIds}
          totalPlaces={totalPlaces}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </PageShell>
  );
}

interface AvailableTrip {
  id: number;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  place_count?: number | null;
  cover_image?: string | null;
}

type TripStatus = 'completed' | 'active' | 'upcoming';

const TRIP_STATUS_LOOK: Record<TripStatus, string> = {
  completed: 'bg-success-soft text-success',
  active: 'bg-info-soft text-info',
  upcoming: 'bg-warning-soft text-warning',
};

/**
 * A new journey: its name typed into the head band, an optional subtitle and
 * the trips it starts from. Everything it edits lives in useJourney; the
 * dialog is its own component so the id it labels itself with stays out of
 * the page body.
 */
function CreateJourneyDialog({
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  trips,
  selectedTripIds,
  onSelectedTripIdsChange,
  totalPlaces,
  onClose,
  onCreate,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  subtitle: string;
  onSubtitleChange: (value: string) => void;
  trips: AvailableTrip[];
  selectedTripIds: Set<number>;
  onSelectedTripIdsChange: Dispatch<SetStateAction<Set<number>>>;
  totalPlaces: number;
  onClose: () => void;
  onCreate: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const today = localIsoDate();

  const toggleTrip = (id: number) => {
    onSelectedTripIdsChange((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const header = (
    <DialogHeader
      tile={
        <DialogTile>
          <BookOpen size={20} strokeWidth={1.9} className="text-content-muted" />
        </DialogTile>
      }
      tint={NEUTRAL_TINT}
      labelId={labelId}
      onClose={onClose}
      eyebrow={t('journey.frontpage.createJourney')}
      titleInput={{
        value: title,
        onChange: onTitleChange,
        label: t('journey.frontpage.journeyName'),
        placeholder: t('journey.frontpage.namePlaceholder'),
        autoFocus: true,
        onKeyDown: (e) => {
          if (e.key === 'Enter' && title.trim()) void onCreate();
        },
      }}
      sub={t('journey.frontpage.createNewSub')}
      subWraps
    />
  );

  const footer = (
    <DialogFooter>
      <span className="flex min-w-0 items-center gap-3 text-content-muted" style={fs(12.5, 'body')}>
        <span>
          <strong className="font-semibold text-content">{selectedTripIds.size}</strong>{' '}
          {t('journey.frontpage.tripsSelected')}
        </span>
        {selectedTripIds.size > 0 && (
          <span>
            <strong className="font-semibold text-content">{totalPlaces}</strong>{' '}
            <span>{t('journey.frontpage.placesImported')}</span>
          </span>
        )}
      </span>
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      <DialogButton variant="primary" onClick={() => void onCreate()} disabled={!title.trim()}>
        {t('journey.frontpage.createJourney')}
      </DialogButton>
    </DialogFooter>
  );

  return (
    // Pinned at the top: the trips arrive after the dialog opens and grow the body.
    <DialogShell onClose={onClose} labelledBy={labelId} width="detail" align="top" header={header} footer={footer}>
      <EditorField label={t('journey.settings.subtitle')} htmlFor={`${labelId}-subtitle`}>
        <input
          id={`${labelId}-subtitle`}
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder={t('journey.settings.subtitlePlaceholder')}
          className={INPUT}
        />
      </EditorField>

      {trips.length > 0 && (
        <DialogSection label={t('journey.frontpage.selectTrips')}>
          <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
            {trips.map((trip) => {
              const selected = selectedTripIds.has(trip.id);
              let status: TripStatus = 'upcoming';
              if (trip.end_date && trip.end_date < today) status = 'completed';
              else if (trip.start_date && trip.start_date <= today) status = 'active';
              const days = trip.start_date
                ? Math.ceil(
                    (new Date(trip.end_date || trip.start_date).getTime() - new Date(trip.start_date).getTime()) /
                      86400000
                  ) + 1
                : '?';
              return (
                <div
                  key={trip.id}
                  role="checkbox"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => toggleTrip(trip.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleTrip(trip.id);
                    }
                  }}
                  className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? 'bg-surface-card shadow-sm' : 'hover:bg-surface-card'}`}
                >
                  <span
                    className={`grid h-4 w-4 flex-none place-items-center rounded-[5px] ${selected ? 'bg-accent text-accent-text' : 'border-[1.5px] border-edge'}`}
                  >
                    {selected && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span
                    className="h-10 w-10 flex-none overflow-hidden rounded-[10px]"
                    style={{ background: pickGradient(trip.id) }}
                  >
                    {trip.cover_image && <img src={trip.cover_image} className="h-full w-full object-cover" alt="" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-content" style={fs(13.5, 'body')}>
                      {trip.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2.5 text-content-faint" style={fs(11.5)}>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {days} {t('journey.stats.days').toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {trip.place_count || 0} {t('journey.frontpage.places')}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`flex-none rounded-full px-2 py-[2px] font-semibold ${TRIP_STATUS_LOOK[status]}`}
                    style={fs(10.5)}
                  >
                    {t(`journey.status.${status}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogSection>
      )}
    </DialogShell>
  );
}

function JourneyCard({
  journey,
  onClick,
}: {
  journey: Journey & {
    entry_count?: number;
    photo_count?: number;
    place_count?: number;
    trip_date_min?: string | null;
    trip_date_max?: string | null;
  };
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const j = journey;
  const entryCount = j.entry_count ?? 0;
  const photoCount = j.photo_count ?? 0;
  const placeCount = j.place_count ?? 0;
  const lifecycle = computeJourneyLifecycle(j.status, j.trip_date_min, j.trip_date_max, j.status_override);

  return (
    <button
      type="button"
      onClick={onClick}
      className="vg-card flex w-full cursor-pointer flex-col overflow-hidden rounded-[24px] text-left transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1"
    >
      {/* Cover with title overlay */}
      <div className="relative h-[200px] overflow-hidden" style={{ background: pickGradient(j.id) }}>
        {j.cover_image && (
          <img src={`/uploads/${j.cover_image}`} className="absolute inset-0 h-full w-full object-cover" alt="" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.62) 100%)' }}
        />

        <span
          className="absolute left-3.5 top-3.5 z-[2] inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.26)',
          }}
        >
          <Calendar size={12} strokeWidth={2.2} />
          {new Date(j.created_at).getFullYear()}
        </span>
        {lifecycle !== 'live' && (
          <span
            className="absolute right-3.5 top-3.5 z-[2] rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            {t(`journey.status.${lifecycle}`)}
          </span>
        )}

        <div className="absolute bottom-[15px] left-[18px] right-[18px] z-[2] text-white">
          <div
            className="text-[21px] font-bold leading-tight tracking-[-0.02em]"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
          >
            {j.title}
          </div>
          {j.subtitle && (
            <div
              className="mt-[3px] text-[12px] font-medium"
              style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
            >
              {j.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Body — stats */}
      <div className="px-[18px] pb-[13px] pt-[11px]">
        <div className="flex gap-[26px]">
          {[
            { val: entryCount, label: t('journey.stats.entries') },
            { val: photoCount, label: t('journey.stats.photos') },
            { val: placeCount, label: t('journey.stats.places') },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span
                className="text-[16px] font-bold leading-none tracking-[-0.01em]"
                style={{ fontFamily: 'var(--font-subtext)', color: s.val > 0 ? 'var(--vg-ink)' : 'var(--vg-ink3)' }}
              >
                {s.val > 0 ? s.val : '--'}
              </span>
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.09em]"
                style={{ color: 'var(--vg-ink3)' }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
