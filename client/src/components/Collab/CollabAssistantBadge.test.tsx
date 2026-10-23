// FE-COLLAB-AIBADGE-001 to FE-COLLAB-AIBADGE-003
import { render, screen } from '../../../tests/helpers/render';
import CollabAssistantBadge from './CollabAssistantBadge';
import { isFromAssistant } from './collabModel';

describe('CollabAssistantBadge', () => {
  it('FE-COLLAB-AIBADGE-001: labels the message as coming from the assistant', () => {
    render(<CollabAssistantBadge name="Alice" />);
    expect(screen.getByText('from the assistant')).toBeInTheDocument();
  });

  it('FE-COLLAB-AIBADGE-002: renders the same label in the phone tones', () => {
    render(<CollabAssistantBadge name="Alice" phone />);
    expect(screen.getByText('from the assistant').className).toContain('text-m-muted');
  });
});

describe('isFromAssistant', () => {
  it('FE-COLLAB-AIBADGE-003: is true only for the assistant origin', () => {
    expect(isFromAssistant({ origin: 'assistant' })).toBe(true);
    expect(isFromAssistant({ origin: null })).toBe(false);
    expect(isFromAssistant({})).toBe(false);
    expect(isFromAssistant({ origin: 'something-else' })).toBe(false);
  });
});
