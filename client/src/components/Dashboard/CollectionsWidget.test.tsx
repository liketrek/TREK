import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import CollectionsWidget from './CollectionsWidget';

// FE-COMP-COLWIDGET-001 onwards

function collections(list: unknown[]) {
  server.use(http.get('/api/addons/collections', () => HttpResponse.json({ collections: list })));
}

const list = (over: Record<string, unknown> = {}) => ({
  id: 1, name: 'Tokyo eats', color: '#ff0000', cover_image: null, place_count: 12, ...over,
});

beforeEach(() => {
  collections([]);
});

describe('CollectionsWidget', () => {
  it('FE-COMP-COLWIDGET-001: shows the empty hint once the fetch resolves', async () => {
    render(<CollectionsWidget onOpen={() => {}} />);

    expect(await screen.findByText('No saved places yet')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('FE-COMP-COLWIDGET-002: renders at most six badges with their counts', async () => {
    collections([1, 2, 3, 4, 5, 6, 7].map(id => list({ id, name: `List ${id}`, place_count: id })));
    render(<CollectionsWidget onOpen={() => {}} />);

    expect(await screen.findByText('List 1')).toBeInTheDocument();
    expect(screen.getByText('List 6')).toBeInTheDocument();
    expect(screen.queryByText('List 7')).not.toBeInTheDocument();
  });

  it('FE-COMP-COLWIDGET-003: a list without a count renders a zero', async () => {
    collections([list({ place_count: null })]);
    render(<CollectionsWidget onOpen={() => {}} />);

    await screen.findByText('Tokyo eats');
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('FE-COMP-COLWIDGET-004: a cover image replaces the gradient tile', async () => {
    collections([list({ cover_image: '/uploads/collections/1.jpg' })]);
    const { container } = render(<CollectionsWidget onOpen={() => {}} />);

    await screen.findByText('Tokyo eats');
    expect(container.querySelector('img.col-badge-media')).toHaveAttribute('src', '/uploads/collections/1.jpg');
  });

  it('FE-COMP-COLWIDGET-005: a list without a colour falls back to the entity gradient', async () => {
    collections([list({ color: null })]);
    const { container } = render(<CollectionsWidget onOpen={() => {}} />);

    await screen.findByText('Tokyo eats');
    const media = container.querySelector('div.col-badge-media') as HTMLElement;
    expect(media.style.backgroundImage).toContain('gradient');
  });

  it('FE-COMP-COLWIDGET-006: the header arrow runs the onOpen callback', async () => {
    const onOpen = vi.fn();
    render(<CollectionsWidget onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'Collections' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COLWIDGET-007: a failing fetch degrades to the empty hint', async () => {
    server.use(http.get('/api/addons/collections', () => new HttpResponse(null, { status: 500 })));
    render(<CollectionsWidget onOpen={() => {}} />);

    expect(await screen.findByText('No saved places yet')).toBeInTheDocument();
  });

  it('FE-COMP-COLWIDGET-008: nothing renders while the fetch is still in flight', async () => {
    render(<CollectionsWidget onOpen={() => {}} />);

    expect(screen.queryByText('No saved places yet')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('No saved places yet')).toBeInTheDocument());
  });
});
