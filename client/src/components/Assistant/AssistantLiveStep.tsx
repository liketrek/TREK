import { MapPin } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { toolStepKey } from './assistantModel';
import { useAssistantView } from './assistantViewContext';
import { useAssistantLiveStep } from './useAssistantLiveStep';

/**
 * The running step as one quiet line: what it does, shimmering, and once it
 * names a place, where ("Searching near Trastevere"). A small pin says the
 * map is looking there too, shown only while the map follows the assistant.
 */
export default function AssistantLiveStep({ toolCallId, toolName }: { toolCallId: string; toolName: string }) {
  const { t } = useTranslation();
  const { tripId } = useAssistantView();
  const live = useAssistantLiveStep(tripId);
  const here = live?.toolCallId === toolCallId ? live : null;
  return (
    <p role="status" className="m-0 flex min-w-0 items-center gap-1.5 text-caption">
      {here?.hasArea && <MapPin size={12} aria-hidden="true" className="flex-shrink-0 text-content-faint" />}
      <span className="trek-assistant-shimmer min-w-0 truncate">{here ? here.text : t(toolStepKey(toolName))}</span>
    </p>
  );
}
