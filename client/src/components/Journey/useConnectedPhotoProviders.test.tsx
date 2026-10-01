// FE-JRN-PROVIDERS-001
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '../../../tests/helpers/msw/server'
import { useConnectedPhotoProviders } from './useConnectedPhotoProviders'

describe('useConnectedPhotoProviders (#2271)', () => {
  it('FE-JRN-PROVIDERS-001: keeps enabled providers that report connected, drops the rest', async () => {
    server.use(
      http.get('/api/addons', () => HttpResponse.json({ addons: [
        { id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true },
        { id: 'synology', name: 'Synology Photos', type: 'photo_provider', enabled: true },
        { id: 'broken', name: 'Broken', type: 'photo_provider', enabled: true },
        { id: 'vacay', name: 'Vacay', type: 'trip', enabled: true },
      ] })),
      http.get('/api/integrations/memories/immich/status', () => HttpResponse.json({ connected: true })),
      http.get('/api/integrations/memories/synology/status', () => HttpResponse.json({ connected: false })),
      http.get('/api/integrations/memories/broken/status', () => HttpResponse.json({}, { status: 500 })),
    )
    const { result } = renderHook(() => useConnectedPhotoProviders())
    await waitFor(() => expect(result.current).toEqual([{ id: 'immich', name: 'Immich' }]))
  })

  it('FE-JRN-PROVIDERS-002: asks nothing while switched off', () => {
    const { result } = renderHook(() => useConnectedPhotoProviders(false))
    expect(result.current).toEqual([])
  })
})
