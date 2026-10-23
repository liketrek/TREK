import type { AssistantMentions } from '@trek/shared';
import { useMemo } from 'react';

import { splitMentions } from './assistantMentionModel';

/**
 * A sent question as the user wrote it, with every `@label` it named a day,
 * place or booking with set off as a quiet inline chip. The labels come from
 * the question's own mentions part, so a stray `@` in the text stays text.
 */
export default function AssistantMentionText({ text, items }: { text: string; items: AssistantMentions['items'] }) {
  const segments = useMemo(
    () =>
      splitMentions(
        text,
        items.map((i) => i.label)
      ),
    [text, items]
  );
  return (
    <>
      {segments.map((s) =>
        s.mention ? (
          <bdi key={s.at} className="rounded-md bg-surface-card px-1 font-medium text-content">
            {s.text}
          </bdi>
        ) : (
          <span key={s.at}>{s.text}</span>
        )
      )}
    </>
  );
}
