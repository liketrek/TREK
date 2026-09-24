import { expect, it } from 'vitest'
import { hazardPopup } from './hazardPopup'

it('renders provider text without HTML and identifies point-only notices', () => {
  const popup = hazardPopup({ id: 'test', source: 'DWD', title: '<img src=x>', description: '<script>bad()</script>',
    updatedAt: '2026-09-12T08:00:00Z', validUntil: null, url: 'https://www.dwd.de/',
    geometry: { type: 'Point', coordinates: [10, 50] },
  }, 'Not a closure', 'Location only')
  expect(popup.querySelector('img,script')).toBeNull()
  expect(popup.textContent).toContain('Location only Not a closure')
  expect(popup.querySelector('a')?.rel).toBe('noopener noreferrer')
})
