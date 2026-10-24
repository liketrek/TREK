import { AlertTriangle, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { fs } from '../shared/DialogShell';
import { CardAction, TourNotice } from './tourParts';

/**
 * How a card's online read stands while it has no answer to show (a bike
 * tour's ways, a hike's SAC grades): still asking, offline, or failed with a
 * way to ask again. Nothing while the answer is there, so the card shows it.
 */
export function ReadStatusNotice({
  status,
  messages,
  onRetry,
}: {
  status: string;
  messages: { loading: string; offline: string; failed: string };
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  if (status === 'loading')
    return (
      <span role="status" className="inline-flex items-center gap-1.5 text-content-muted" style={fs(11.5, 'body')}>
        <Loader2 size={12} strokeWidth={2} className="animate-spin" />
        {messages.loading}
      </span>
    );
  if (status === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{messages.offline}</TourNotice>;
  if (status !== 'failed') return null;
  return (
    <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{messages.failed}</span>
        <CardAction icon={<RefreshCw size={12} strokeWidth={2} />} onClick={onRetry}>
          {t('common.errorRetry')}
        </CardAction>
      </span>
    </TourNotice>
  );
}
