// Keep Vite's virtual PWA module behind a real module boundary so non-PWA
// tooling (notably Vitest) can mock the registration lifecycle reliably.
export { useRegisterSW } from 'virtual:pwa-register/react'
