import { ArrowLeft, ArrowRight, Clock, ExternalLink, Images, RotateCcw } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useTranslation } from '../../i18n';
import MSheet from '../../mobile/components/MSheet';
import { Eyebrow, SHEET_PRIMARY, SHEET_SECONDARY } from '../../mobile/screens/trip/sheets/MTripSheetUi';
import { FormSheetHeader } from '../../mobile/screens/trip/sheets/PlSheetChrome';
import ErrorBoundary from '../shared/ErrorBoundary';
import TrekIcon from '../shared/TrekIcon';
import { DEMO_FEATURES, DEMO_FULL_VERSION, DEMO_LIMITS, TREK_REPO_URL, type DemoLine } from './demoWelcomeModel';

const DemoCredits = lazy(() => import('./DemoCredits'));

type Translate = ReturnType<typeof useTranslation>['t'];

interface MDemoWelcomeProps {
  open: boolean;
  close: () => void;
  countdown: string;
  creditsOpen: boolean;
  openCredits: () => void;
  closeCredits: () => void;
}

const CARD = 'rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]';

function Lines({ lines, accent, t }: { lines: readonly DemoLine[]; accent?: boolean; t: Translate }) {
  return (
    <ul className={`${CARD} m-0 flex list-none flex-col gap-2 p-3`}>
      {lines.map(({ icon: Icon, labelKey }) => (
        <li key={labelKey} className="flex items-center gap-2.5 text-[0.78125rem] text-m-ink">
          <Icon
            size={15}
            strokeWidth={2}
            className={`flex-none ${accent ? 'text-success' : 'text-m-faint'}`}
            aria-hidden
          />
          <span>{t(labelKey)}</span>
        </li>
      ))}
    </ul>
  );
}

function Welcome({ t }: { t: Translate }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[0.8125rem] leading-snug text-m-muted">{t('demo.welcome.tagline')}</p>

      <div className="flex items-start gap-2.5 rounded-[18px] bg-warning-soft px-3.5 py-3">
        <RotateCcw size={16} strokeWidth={2.2} className="mt-0.5 flex-none text-warning" aria-hidden />
        <div className="min-w-0">
          <div className="text-[0.8125rem] font-semibold text-m-ink">{t('demo.welcome.resetTitle')}</div>
          <p className="m-0 mt-0.5 text-[0.75rem] leading-snug text-m-muted">{t('demo.welcome.resetBody')}</p>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <Eyebrow>{t('demo.welcome.tryTitle')}</Eyebrow>
        <ul className={`${CARD} m-0 flex list-none flex-col divide-y divide-[color:var(--m-rowbr)] p-0`}>
          {DEMO_FEATURES.map(({ id, icon: Icon, titleKey, bodyKey }) => (
            <li key={id} className="flex gap-3 px-3 py-2.5">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-[color:var(--m-sheetop)] text-m-ink">
                <Icon size={15} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="text-[0.8125rem] font-semibold text-m-ink">{t(titleKey)}</div>
                <p className="m-0 text-[0.71875rem] leading-snug text-m-muted">{t(bodyKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <Eyebrow>{t('demo.welcome.limitsTitle')}</Eyebrow>
        <Lines lines={DEMO_LIMITS} t={t} />
      </section>

      <section className="flex flex-col gap-2">
        <Eyebrow>{t('demo.welcome.fullTitle')}</Eyebrow>
        <Lines lines={DEMO_FULL_VERSION} accent t={t} />
      </section>
    </div>
  );
}

/**
 * The demo welcome on a phone: a sheet from the bottom like every other form
 * in the phone shell, instead of the desktop dialog squeezed onto a narrow
 * screen. The head stays small so the list gets the room, the start button
 * runs the full width, and the two links sit under it.
 */
export default function MDemoWelcome({
  open,
  close,
  countdown,
  creditsOpen,
  openCredits,
  closeCredits,
}: MDemoWelcomeProps) {
  const { t } = useTranslation();
  const title = t(creditsOpen ? 'demo.credits.title' : 'demo.welcome.title');

  return (
    <MSheet open={open} onClose={close} variant="bottom" material="glass" ariaLabel={t('demo.welcome.eyebrow')}>
      <div className="flex max-h-[88dvh] min-h-0 flex-col">
        <FormSheetHeader
          leading={
            <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-[color:var(--m-ic)]">
              <TrekIcon className="h-6 w-6 text-m-ink" />
            </span>
          }
          title={title}
          subtitle={
            <span className="inline-flex items-center gap-1">
              <Clock size={11} strokeWidth={2.2} aria-hidden />
              {t('demo.welcome.resetIn')}
              <span className="tabular-nums" data-testid="demo-countdown">
                {countdown}
              </span>
            </span>
          }
          onClose={close}
          closeLabel={t('common.close')}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 pt-1">
          {creditsOpen ? (
            <ErrorBoundary boundaryId="demo-credits">
              <Suspense fallback={null}>
                <DemoCredits />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <Welcome t={t} />
          )}
        </div>

        <div className="flex flex-none flex-col gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
          {creditsOpen ? (
            <button type="button" onClick={closeCredits} className={`${SHEET_SECONDARY} w-full`}>
              <ArrowLeft size={15} strokeWidth={2.2} className="rtl:-scale-x-100" aria-hidden />
              {t('demo.credits.back')}
            </button>
          ) : (
            <>
              <button type="button" onClick={close} className={`${SHEET_PRIMARY} w-full justify-center`}>
                {t('demo.welcome.start')}
                <ArrowRight size={15} strokeWidth={2.2} className="rtl:-scale-x-100" aria-hidden />
              </button>
              <div className="flex items-center justify-center gap-5 text-[0.75rem] font-medium text-m-muted">
                <a
                  href={TREK_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-m-muted no-underline"
                >
                  <ExternalLink size={13} strokeWidth={2} aria-hidden />
                  {t('demo.welcome.repo')}
                </a>
                <button type="button" onClick={openCredits} className="inline-flex items-center gap-1.5 text-m-muted">
                  <Images size={13} strokeWidth={2} aria-hidden />
                  {t('demo.welcome.credits')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </MSheet>
  );
}
