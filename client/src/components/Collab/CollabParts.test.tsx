/**
 * FE-COLLAB-PARTS-001 to FE-COLLAB-PARTS-005
 *
 * The pieces the Collab tab and the assistant chat's cards draw a message, a
 * poll option and a note's head band with: the bubble's sides, tail and
 * quote, the face or its letter, the option as a button or a row with its
 * results and a held vote, the tinted band with its dot and pin, and links
 * that read as words where they must not open.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatAvatar, ChatBubble, ChatDateSeparator, ChatReactions, ChatTime } from './CollabChatBubble';
import { MessageText } from './CollabChatMessageText';
import { NoteHeadBand } from './CollabNoteHead';
import { PollChip, PollOptionRow } from './CollabPollOption';

describe('the Collab pieces', () => {
  it('FE-COLLAB-PARTS-001: a bubble takes its side colour, its tail on the last of a run and the quote it answers', () => {
    const { rerender } = render(<ChatBubble own lastInGroup reply={null} text="mine" />);
    const own = screen.getByText('mine');
    expect(own.getAttribute('style')).toContain('background: var(--accent)');
    expect(own.getAttribute('style')).toContain('border-end-end-radius: 4px');
    rerender(<ChatBubble own={false} lastInGroup={false} reply={{ name: 'Anna', text: 'Train?' }} text="yours" />);
    const quoted = screen.getByText('yours');
    expect(quoted.parentElement?.getAttribute('style')).toContain('background: var(--bg-card)');
    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('Train?')).toBeInTheDocument();
  });

  it('FE-COLLAB-PARTS-002: a face is the picture, else the first letter; day, reactions and time draw their children', () => {
    const { container, rerender } = render(<ChatAvatar name="jon" src={null} size={24} />);
    expect(screen.getByText('J').getAttribute('style')).toContain('width: 24px');
    rerender(<ChatAvatar name="jon" src="/uploads/avatars/jon.png" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/uploads/avatars/jon.png');
    rerender(
      <>
        <ChatDateSeparator label="Today" />
        <ChatReactions own>
          <span>❤️</span>
        </ChatReactions>
        <ChatTime>09:12</ChatTime>
      </>
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('❤️').parentElement?.parentElement?.getAttribute('style')).toContain('flex-end');
    expect(screen.getByText('09:12')).toBeInTheDocument();
  });

  it('FE-COLLAB-PARTS-003: links open in a new tab in the chat and read as words where they must not open', () => {
    const { container, rerender } = render(<MessageText text="see https://a.example/x now" />);
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://a.example/x');
    rerender(<MessageText text="see https://a.example/x now" plain />);
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('https://a.example/x').tagName).toBe('SPAN');
  });

  it('FE-COLLAB-PARTS-004: an option votes as a button, shows as a row, and marks a held vote', () => {
    const onClick = vi.fn();
    const voters = [{ key: 7, name: 'anna', src: null }];
    const { rerender } = render(
      <PollOptionRow
        text="Pizza"
        pct={50}
        mine={false}
        winner={false}
        showResults={false}
        voters={voters}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByText('50%')).toBeNull();
    rerender(
      <PollOptionRow
        as="div"
        text="Pizza"
        pct={50}
        mine
        winner={false}
        showResults
        voters={voters}
        pending={{ label: 'Your vote' }}
      />
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Your vote').className).toContain('sr-only');
    expect(screen.getByText('Pizza').closest('div')?.className).toContain('border-dashed');
    render(<PollChip tone="info">New</PollChip>);
    expect(screen.getByText('New').className).toContain('text-info');
  });

  it("FE-COLLAB-PARTS-005: a note's band shows its category as a dot, its title and its pin", () => {
    const { container } = render(
      <NoteHeadBand title="Food" color="#10b981" category="Ideas" pinned bordered trailing={<span>end</span>} />
    );
    expect(screen.getByTestId('note-category-dot').style.background).toBe('rgb(16, 185, 129)');
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('end')).toBeInTheDocument();
    expect(container.querySelector('.lucide-pin')).not.toBeNull();
    expect(container.firstElementChild?.className).toContain('border-b');
  });
});
