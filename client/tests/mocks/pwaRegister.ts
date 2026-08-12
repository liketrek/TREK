import { useState } from 'react'

/** Test-only stand-in for vite-plugin-pwa's virtual React registration hook. */
export function useRegisterSW() {
  return {
    needRefresh: useState(false),
    offlineReady: useState(false),
    updateServiceWorker: async () => undefined,
  }
}
