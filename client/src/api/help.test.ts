import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { searchHelp } from './help'

describe('searchHelp', () => {
  it('asks /api/help/search with the query and limit and unwraps the hits', async () => {
    let url = ''
    server.use(
      http.get('/api/help/search', ({ request }) => {
        url = request.url
        return HttpResponse.json({ hits: [{ slug: 'Home', title: 'Home', section: '', anchor: null, heading: null, snippet: 'x', score: 1 }] })
      }),
    )
    const hits = await searchHelp('cover image', undefined, 3)
    expect(hits).toHaveLength(1)
    const params = new URL(url).searchParams
    expect(params.get('q')).toBe('cover image')
    expect(params.get('limit')).toBe('3')
  })

  it('rejects with the server error', async () => {
    server.use(http.get('/api/help/search', () => HttpResponse.json({ error: 'A search query is required' }, { status: 400 })))
    await expect(searchHelp('')).rejects.toBeTruthy()
  })
})
