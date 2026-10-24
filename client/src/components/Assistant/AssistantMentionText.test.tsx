/**
 * FE-AI-MENTION-TEXT-001 to FE-AI-MENTION-TEXT-002
 *
 * A sent question with the days, places and bookings it named set off as
 * chips, and every other `@` left as text.
 */
import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import AssistantMentionText from './AssistantMentionText';

describe('AssistantMentionText', () => {
  it('FE-AI-MENTION-TEXT-001: sets off each named @label and keeps the words around it', () => {
    const { container } = render(
      <p>
        <AssistantMentionText
          text="Is @Louvre open on @Arrival?"
          items={[
            { kind: 'place', id: 21, label: 'Louvre' },
            { kind: 'day', id: 11, label: 'Arrival' },
          ]}
        />
      </p>
    );
    expect(container.querySelector('p')?.textContent).toBe('Is @Louvre open on @Arrival?');
    expect(screen.getByText('@Louvre').tagName).toBe('BDI');
    expect(screen.getByText('@Arrival').tagName).toBe('BDI');
  });

  it('FE-AI-MENTION-TEXT-002: an @ that names nothing stays plain text', () => {
    const { container } = render(
      <p>
        <AssistantMentionText
          text="Write to me @ home or @Louvre2"
          items={[{ kind: 'place', id: 21, label: 'Louvre' }]}
        />
      </p>
    );
    expect(container.querySelector('p')?.textContent).toBe('Write to me @ home or @Louvre2');
    expect(container.querySelector('bdi')).toBeNull();
  });
});
