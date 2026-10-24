import { Sparkles } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { Tooltip } from '../shared/Tooltip';

interface CollabAssistantBadgeProps {
  /** Who shared the answer, named in the tooltip. */
  name: string;
  phone?: boolean;
}

/**
 * The small label on a chat message someone shared from an assistant answer.
 * The server sets the origin, so the label reads in each reader's own language
 * and nobody can type it into a plain message.
 */
export default function CollabAssistantBadge({ name, phone = false }: CollabAssistantBadgeProps) {
  const { t } = useTranslation();
  const tone = phone ? 'bg-m-inner text-m-muted' : 'bg-surface-secondary text-content-muted';
  return (
    <Tooltip label={t('collab.chat.fromAssistantHint', { name })} placement="top">
      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 text-caption font-medium ${tone}`}>
        <Sparkles size={10} aria-hidden="true" />
        {t('collab.chat.fromAssistant')}
      </span>
    </Tooltip>
  );
}
