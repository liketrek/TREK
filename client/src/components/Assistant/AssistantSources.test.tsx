/**
 * FE-AI-SOURCES-001 to FE-AI-SOURCES-002
 *
 * The pages an answer cites from the provider's web search: a chip per page
 * with its site and title, opening in a new tab without telling the page who
 * sent the reader, and the block they form in an answer.
 */
import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import AssistantSources from './AssistantSources';
import { messageBlocks } from './assistantParts';

describe('AssistantSources', () => {
  it('FE-AI-SOURCES-001: names each page by its site and title, and opens it in a new tab', () => {
    render(
      <AssistantSources
        sources={[
          { url: 'https://www.rostock.de/hafen', title: 'Stadthafen Rostock' },
          { url: 'https://example.org/a', title: 'https://example.org/a' },
        ]}
      />
    );
    expect(screen.getByRole('navigation', { name: 'Sources' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /rostock\.de/ });
    expect(link).toHaveAttribute('href', 'https://www.rostock.de/hafen');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(screen.getByText('Stadthafen Rostock')).toBeInTheDocument();
    // A title that is only the address shows the site alone.
    expect(screen.getByRole('link', { name: 'example.org' })).toBeInTheDocument();
  });

  it('FE-AI-SOURCES-002: an answer keeps its sources as a block of their own after its text', () => {
    const blocks = messageBlocks(
      {
        id: 'm1',
        role: 'assistant',
        status: 'complete',
        createdAt: '2026-10-23T10:00:00.000Z',
        parts: [
          { type: 'tool-call', toolCallId: 'web-1', toolName: 'web_search', args: { query: 'x' }, result: 'searched' },
          { type: 'text', text: 'Eat at the harbour.' },
          { type: 'data-trek-sources', data: { sources: [{ url: 'https://a.example', title: 'A' }] } },
        ],
      },
      false
    );
    expect(blocks.map((block) => block.kind)).toEqual(['steps', 'text', 'sources']);
  });
});
