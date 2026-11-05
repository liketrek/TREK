// FE-ADMIN-CONTRIB-LOG-001 to FE-ADMIN-CONTRIB-LOG-004
import userEvent from '@testing-library/user-event';
import type { PlaceContribLogEntry } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import PlaceContribLog from './PlaceContribLog';

vi.mock('../../i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../i18n')>()),
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
}));

const ENTRY: PlaceContribLogEntry = {
  id: 1,
  day: '2026-10-29',
  key: 'osm:n123',
  placeName: 'Café Luitpold',
  field: 'phone',
  valueSummary: '+49 89 242 8750',
  result: 'accepted',
  reason: null,
};

function serve(entries: PlaceContribLogEntry[], total = entries.length) {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get('/api/admin/places-contribute/log', ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json({
        entries,
        total,
        page: Number(new URL(request.url).searchParams.get('page') ?? 1),
        perPage: 20,
      });
    })
  );
  return queries;
}

describe('PlaceContribLog', () => {
  it('FE-ADMIN-CONTRIB-LOG-001: lists the place, the value, the field and the result', async () => {
    serve([ENTRY]);
    render(<PlaceContribLog />);
    expect(await screen.findByText('Café Luitpold')).toBeInTheDocument();
    expect(screen.getByText('+49 89 242 8750')).toBeInTheDocument();
    expect(screen.getByText('admin.contribute.field.phone')).toBeInTheDocument();
    expect(screen.getByText('admin.contribute.result.accepted')).toBeInTheDocument();
  });

  it('FE-ADMIN-CONTRIB-LOG-002: an empty log says nothing was sent', async () => {
    serve([]);
    render(<PlaceContribLog />);
    expect(await screen.findByText('admin.contribute.log.empty')).toBeInTheDocument();
  });

  it('FE-ADMIN-CONTRIB-LOG-003: pages through a long log', async () => {
    const queries = serve([ENTRY], 45);
    render(<PlaceContribLog />);
    await userEvent.click(await screen.findByRole('button', { name: /common\.showMore/ }));
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'admin.contribute.log.next' }));
    await waitFor(() => expect(queries[queries.length - 1]?.get('page')).toBe('2'));
    expect(queries[queries.length - 1]?.get('perPage')).toBe('20');
  });

  it('FE-ADMIN-CONTRIB-LOG-004: shows the newest five until the list is opened', async () => {
    serve(Array.from({ length: 8 }, (_, i) => ({ ...ENTRY, id: i + 1, placeName: `Place ${i + 1}` })));
    render(<PlaceContribLog />);
    expect(await screen.findByText('Place 5')).toBeInTheDocument();
    expect(screen.queryByText('Place 6')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'common.showMore (3)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByText('Place 8')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'common.showLess' }));
    expect(screen.queryByText('Place 8')).not.toBeInTheDocument();
  });
});
