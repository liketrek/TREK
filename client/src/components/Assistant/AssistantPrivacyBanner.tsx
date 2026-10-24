import { ChevronDown, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '../../i18n';
import { useAssistantStore } from '../../store/assistantStore';
import { useToast } from '../shared/Toast';
import { useAssistantScope } from './assistantViewContext';
import { providerLabel } from './providerCatalog';

/**
 * Who reads along, said once. A user who connected their own provider agreed
 * to this while connecting; on the admin's connection the chat says it here,
 * above the composer, until the user has read it. A new provider set up by
 * the admin asks again, because the answer is stored per provider and host.
 * In TREK Studio the chat is about a journey and its book, so the banner
 * speaks of those; a picture of a page has the Studio's own notice.
 */
export default function AssistantPrivacyBanner() {
  const { t } = useTranslation();
  const toast = useToast();
  const effective = useAssistantStore((s) => s.status?.effective ?? null);
  const acked = useAssistantStore((s) => s.status?.privacyAcked ?? true);
  const ackPrivacy = useAssistantStore((s) => s.ackPrivacy);
  const [details, setDetails] = useState(false);
  // The Studio's chat reads a journey, never a trip, and may show pages once the user allows it.
  const book = useAssistantScope().kind === 'journey';

  if (!effective || effective.source !== 'instance' || acked) return null;
  const provider = providerLabel(effective.kind, effective.host);

  const confirm = async () => {
    try {
      await ackPrivacy();
    } catch {
      toast.error(t('assistant.error.generic'));
    }
  };

  return (
    <div className="trek-assistant-enter rounded-lg border border-edge-faint bg-surface-secondary px-3 py-2.5 text-caption text-content-secondary">
      <div className="flex items-start gap-2.5">
        <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-content-muted" />
        <p className="m-0 min-w-0 flex-1">
          {book ? t('assistant.privacy.bannerBook', { provider }) : t('assistant.privacy.banner', { provider })}
        </p>
      </div>
      {details && (
        <ul className="m-0 mt-2 list-disc space-y-1 ps-9">
          <li>{book ? t('assistant.privacy.sharedBook') : t('assistant.privacy.shared')}</li>
          <li>{book ? t('assistant.privacy.notSharedBook') : t('assistant.privacy.notShared')}</li>
          <li>{t('assistant.privacy.provider', { provider })}</li>
        </ul>
      )}
      <div className="mt-2 flex items-center justify-end gap-1">
        {!details && (
          <button
            type="button"
            onClick={() => setDetails(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption text-content-muted hover:bg-surface-hover hover:text-content"
          >
            {t('assistant.privacy.what')}
            <ChevronDown size={12} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void confirm()}
          className="rounded-md px-2 py-1 text-caption font-medium text-accent-on hover:bg-surface-hover"
        >
          {t('assistant.privacy.ok')}
        </button>
      </div>
    </div>
  );
}
