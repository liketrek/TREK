import { ArrowLeft, ArrowRight, Clock, ExternalLink, Images, RotateCcw } from 'lucide-react';
import { lazy, Suspense, useId } from 'react';
import { useTranslation } from '../../i18n';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
  PILL,
} from '../shared/DialogShell';
import ErrorBoundary from '../shared/ErrorBoundary';
import TrekIcon from '../shared/TrekIcon';
import { DEMO_FEATURES, DEMO_FULL_VERSION, DEMO_LIMITS, TREK_REPO_URL, type DemoLine } from './demoWelcomeModel';
import { useDemoWelcome } from './useDemoWelcome';

// The credits and their photo list load when a visitor opens them, not with the dashboard.
const DemoCredits = lazy(() => import('./DemoCredits'));

type Translate = ReturnType<typeof useTranslation>['t'];

const FOOTER_LINK = 'inline-flex items-center gap-1.5 font-medium text-content-muted no-underline hover:text-content';

/** The tiles: what a visitor can open right now, one card each. */
function FeatureGrid({ t }: { t: Translate }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {DEMO_FEATURES.map(({ id, icon: Icon, titleKey, bodyKey }) => (
        <div key={id} className="flex gap-3 rounded-[16px] border border-edge-faint bg-surface-secondary p-3.5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-[12px] bg-surface-card text-content shadow-sm">
            <Icon size={17} strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-content" style={fs(13.5, 'body')}>
              {t(titleKey)}
            </div>
            <p className="m-0 mt-0.5 leading-snug text-content-muted" style={fs(12, 'body')}>
              {t(bodyKey)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A short list with an icon per line, for what the demo leaves out and what the full version adds. */
function LineList({ lines, tone, t }: { lines: readonly DemoLine[]; tone: 'muted' | 'accent'; t: Translate }) {
  const iconClass = tone === 'accent' ? 'text-success' : 'text-content-faint';
  return (
    <ul className="m-0 flex list-none flex-col gap-2 rounded-[16px] border border-edge-faint bg-surface-card p-3.5">
      {lines.map(({ icon: Icon, labelKey }) => (
        <li key={labelKey} className="flex items-center gap-2.5 text-content-secondary" style={fs(12.5, 'body')}>
          <Icon size={15} strokeWidth={2} className={`flex-none ${iconClass}`} aria-hidden />
          <span>{t(labelKey)}</span>
        </li>
      ))}
    </ul>
  );
}

/** The welcome itself: the hourly reset, the tiles, and the two lists under them. */
function WelcomeBody({ t }: { t: Translate }) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-[16px] bg-warning-soft px-4 py-3">
        <RotateCcw size={17} strokeWidth={2.2} className="mt-0.5 flex-none text-warning" aria-hidden />
        <div className="min-w-0">
          <div className="font-semibold text-content" style={fs(13.5, 'body')}>
            {t('demo.welcome.resetTitle')}
          </div>
          <p className="m-0 mt-0.5 leading-snug text-content-secondary" style={fs(12.5, 'body')}>
            {t('demo.welcome.resetBody')}
          </p>
        </div>
      </div>

      <DialogSection label={t('demo.welcome.tryTitle')}>
        <FeatureGrid t={t} />
      </DialogSection>

      <div className="grid gap-5 md:grid-cols-2">
        <DialogSection label={t('demo.welcome.limitsTitle')}>
          <LineList lines={DEMO_LIMITS} tone="muted" t={t} />
        </DialogSection>
        <DialogSection label={t('demo.welcome.fullTitle')}>
          <LineList lines={DEMO_FULL_VERSION} tone="accent" t={t} />
        </DialogSection>
      </div>
    </>
  );
}

/**
 * The footer's links: the source code, and the credits for the demo's photos.
 * One above the other on a phone, where the footer has no room for both
 * beside the button.
 */
function FooterLinks({ t, onCredits, focusCredits }: { t: Translate; onCredits: () => void; focusCredits: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <a
        href={TREK_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={FOOTER_LINK}
        style={fs(12.5, 'body')}
      >
        <ExternalLink size={15} strokeWidth={2} aria-hidden />
        {t('demo.welcome.repo')}
      </a>
      <button
        type="button"
        onClick={onCredits}
        autoFocus={focusCredits}
        className={FOOTER_LINK}
        style={fs(12.5, 'body')}
      >
        <Images size={15} strokeWidth={2} aria-hidden />
        {t('demo.welcome.credits')}
      </button>
    </div>
  );
}

/**
 * The welcome a demo instance opens with: what TREK is, that the demo resets
 * on the hour (with the live countdown), what to try right away, what the
 * demo leaves out and what the full version adds. The photo credits open in
 * its place and back. Closed by the button, Escape or a click on the
 * backdrop, and shown again on the next visit.
 */
export default function DemoWelcome() {
  const { t } = useTranslation();
  const labelId = useId();
  const { open, close, countdown, creditsOpen, backFromCredits, openCredits, closeCredits } = useDemoWelcome();

  return (
    <DialogShell
      open={open}
      onClose={close}
      labelledBy={labelId}
      width="wide"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <TrekIcon className="h-7 w-7 text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          eyebrow={t('demo.welcome.eyebrow')}
          title={t(creditsOpen ? 'demo.credits.title' : 'demo.welcome.title')}
          sub={creditsOpen ? undefined : t('demo.welcome.tagline')}
          subWraps
          pills={
            <span className={PILL}>
              <Clock size={13} strokeWidth={2.2} aria-hidden />
              {t('demo.welcome.resetIn')}
              <span className="font-geist tabular-nums" data-testid="demo-countdown">
                {countdown}
              </span>
            </span>
          }
        />
      }
      footer={
        <DialogFooter>
          {/* The start button keeps its place in both views, so switching does not move the focus onto it again. */}
          {creditsOpen ? (
            <DialogButton
              onClick={closeCredits}
              autoFocus
              icon={<ArrowLeft size={15} strokeWidth={2.2} className="rtl:-scale-x-100" />}
            >
              {t('demo.credits.back')}
            </DialogButton>
          ) : (
            <FooterLinks t={t} onCredits={openCredits} focusCredits={backFromCredits} />
          )}
          <FooterSpacer />
          <DialogButton variant="primary" onClick={close} autoFocus icon={<ArrowRight size={15} strokeWidth={2.2} />}>
            {t('demo.welcome.start')}
          </DialogButton>
        </DialogFooter>
      }
    >
      {creditsOpen ? (
        <ErrorBoundary boundaryId="demo-credits">
          <Suspense fallback={null}>
            <DemoCredits />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <WelcomeBody t={t} />
      )}
    </DialogShell>
  );
}
