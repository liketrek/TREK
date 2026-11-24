import { Loader2, PenLine, RotateCcw, Route, Sparkles, Trash2 } from 'lucide-react';
import React from 'react';
import TravelBriefForm from '../../components/AiTravelPlan/TravelBriefForm';
import TravelDraftApplyCard from '../../components/AiTravelPlan/TravelDraftApplyCard';
import TravelDraftBudget from '../../components/AiTravelPlan/TravelDraftBudget';
import TravelDraftLodging from '../../components/AiTravelPlan/TravelDraftLodging';
import TravelDraftMap from '../../components/AiTravelPlan/TravelDraftMap';
import TravelDraftSources from '../../components/AiTravelPlan/TravelDraftSources';
import TravelDraftTimeline from '../../components/AiTravelPlan/TravelDraftTimeline';
import TravelDraftWarnings from '../../components/AiTravelPlan/TravelDraftWarnings';
import type { DraftTravelMode } from '../../components/AiTravelPlan/draftNavigation';
import PageShell from '../../components/Layout/PageShell';
import TripShareDialog from '../../components/Trips/TripShareDialog';
import { useAiTravelPlan } from './useAiTravelPlan';

function formatCny(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string, locale: string): string {
  if (!value) return '—';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * The proposal's header: status, dates, counts and the two "start again" actions.
 * Kept out of the page so the page itself stays a flat layout.
 */
function DraftOverview({ vm }: { vm: ReturnType<typeof useAiTravelPlan> }): React.ReactElement | null {
  const { t, locale, plan, draft } = vm;
  if (!plan) return null;
  const canRecalculate =
    (plan.status === 'draft' || plan.status === 'ready' || plan.status === 'failed') &&
    (draft?.days.some((day) => day.items.length > 1) ?? false);
  return (
    <section className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-content-secondary">
          {t(`planner.ai.status.${plan.status}`)}
        </span>
        <span className="text-xs text-content-muted">
          {t('planner.ai.revision')} {plan.currentRevision}
        </span>
        <span className="ms-auto text-xs text-content-muted">
          {formatDate(plan.request.startDate ?? '', locale)} – {formatDate(plan.request.endDate ?? '', locale)}
        </span>
      </div>

      <h2 className="mt-3 text-lg font-semibold text-content">
        {plan.request.destination ?? t('planner.ai.untitled')}
      </h2>
      {draft?.summary && <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">{draft.summary}</p>}

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg bg-surface-secondary px-2.5 py-1.5 text-content-secondary">
          {t('planner.days')} {vm.dayCount}
        </span>
        <span className="rounded-lg bg-surface-secondary px-2.5 py-1.5 text-content-secondary">
          {t('planner.places')} {vm.placeCount}
        </span>
        {draft?.estimatedBudgetCny && (
          <span className="rounded-lg bg-surface-secondary px-2.5 py-1.5 text-content-secondary">
            {formatCny(draft.estimatedBudgetCny.min, locale)}–{formatCny(draft.estimatedBudgetCny.max, locale)}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={vm.handleEditRequest}
          disabled={vm.isBusy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-content transition hover:bg-surface-hover disabled:opacity-60"
        >
          <PenLine size={13} />
          {t('planner.ai.editBrief')}
        </button>
        {canRecalculate && (
          <button
            type="button"
            onClick={() => {
              void vm.handleRecalculate();
            }}
            disabled={vm.isBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-content transition hover:bg-surface-hover disabled:opacity-60"
          >
            {vm.pending === 'recalculating' ? <Loader2 size={13} className="animate-spin" /> : <Route size={13} />}
            {vm.pending === 'recalculating' ? t('planner.ai.recalculating') : t('planner.ai.recalculate')}
          </button>
        )}
        <button
          type="button"
          onClick={vm.handleStartOver}
          disabled={vm.isBusy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-content transition hover:bg-surface-hover disabled:opacity-60"
        >
          <RotateCcw size={13} />
          {t('planner.ai.startOver')}
        </button>
      </div>
    </section>
  );
}

/**
 * `/plan` — the traveller describes a trip, reads the proposal, asks for one
 * more change, then confirms the write. Everything stateful is in
 * `useAiTravelPlan`; this file only lays the pieces out.
 */
export default function AiTravelPlanPage(): React.ReactElement {
  const vm = useAiTravelPlan();
  const { t, plan, draft } = vm;
  const [shareOpen, setShareOpen] = React.useState(false);
  // One switch for every navigation link on the page: the map legend owns the
  // control, the timeline under it follows the same choice.
  const [navMode, setNavMode] = React.useState<DraftTravelMode>('drive');

  return (
    <PageShell background="var(--bg-secondary)">
      {/* pb clears the phone's floating dock, whose centre FAB otherwise sits on the form's submit button. */}
      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-[calc(var(--bottom-nav-h,0px)_+_24px)] sm:px-6 md:pb-10 lg:py-10">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent-on">
            <Sparkles size={13} />
            {t('planner.ai.badge')}
          </div>
          <h1 className="text-2xl font-bold text-content sm:text-3xl">{t('planner.ai.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-muted">{t('planner.ai.subtitle')}</p>
        </header>

        {vm.error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-content"
          >
            {vm.error}
          </div>
        )}

        {!plan ? (
          <TravelBriefForm
            brief={vm.brief}
            disabled={vm.isBusy}
            destinationIdeas={vm.destinationIdeas}
            ideasPending={vm.ideasPending}
            onSuggestDestinations={vm.suggestDestinations}
            onPickDestinationIdea={vm.pickDestinationIdea}
            onChange={vm.updateBrief}
            onSubmit={() => {
              void vm.handleCreate();
            }}
          />
        ) : (
          <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
            <main className="min-w-0 flex-1 space-y-5">
              <DraftOverview vm={vm} />

              <TravelDraftMap draft={draft} navMode={navMode} onNavModeChange={setNavMode} />
              {draft && (
                <>
                  <TravelDraftBudget budget={draft.estimatedBudgetCny} />
                  {draft.days.length > 0 && <TravelDraftTimeline days={draft.days} navMode={navMode} />}
                  <TravelDraftLodging areas={draft.lodgingAreas ?? []} />
                  <TravelDraftSources draft={draft} />
                </>
              )}
              <TravelDraftWarnings warnings={plan.warnings} />

              {plan.status !== 'applied' && plan.status !== 'expired' && (
                <section className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
                  <h2 className="mb-3 text-sm font-semibold text-content">{t('planner.ai.reviseTitle')}</h2>
                  <textarea
                    className="min-h-20 w-full resize-y rounded-xl border border-edge bg-surface-input px-3 py-2 text-sm text-content placeholder:text-content-faint focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                    value={vm.feedback}
                    maxLength={2000}
                    disabled={vm.isBusy}
                    placeholder={t('planner.ai.revisePlaceholder')}
                    onChange={(event) => vm.setFeedback(event.target.value)}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        void vm.handleRevise();
                      }}
                      disabled={vm.isBusy}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-text transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {vm.pending === 'revising' && <Loader2 size={15} className="animate-spin" />}
                      {vm.pending === 'revising' ? t('planner.ai.revising') : t('planner.ai.reviseSubmit')}
                    </button>
                  </div>
                </section>
              )}
            </main>

            <aside className="space-y-4 lg:w-[340px] lg:shrink-0">
              {(plan.status === 'ready' || plan.status === 'applied') && (
                <TravelDraftApplyCard
                  draft={draft}
                  applyResult={plan.applyResult}
                  canApply={vm.canApply}
                  blocking={vm.blocking}
                  busy={vm.isBusy}
                  tripOptions={vm.tripOptions}
                  mode={vm.applyMode}
                  tripId={vm.applyTripId}
                  title={vm.applyTitle}
                  onModeChange={vm.setApplyMode}
                  onTripChange={vm.setApplyTripId}
                  onTitleChange={vm.setApplyTitle}
                  onApply={() => {
                    void vm.handleApply();
                  }}
                  onUndo={() => {
                    void vm.handleUndo();
                  }}
                  onOpenTrip={vm.handleOpenTrip}
                  onInvite={() => setShareOpen(true)}
                />
              )}

              <button
                type="button"
                onClick={() => {
                  void vm.handleDiscard();
                }}
                disabled={vm.isBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-edge px-4 py-2 text-sm font-medium text-content-muted transition hover:bg-surface-hover hover:text-danger disabled:opacity-60"
              >
                <Trash2 size={15} />
                {vm.pending === 'discarding' ? t('planner.ai.discarding') : t('planner.ai.discard')}
              </button>
            </aside>
          </div>
        )}
      </div>

      {plan?.applyResult && plan.applyResult.mode === 'new_trip' && (
        <TripShareDialog
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          tripId={plan.applyResult.tripId}
          tripTitle={vm.applyTitle || plan.request.destination || t('planner.ai.untitled')}
          permissionTrip={{ is_owner: true }}
        />
      )}
    </PageShell>
  );
}
