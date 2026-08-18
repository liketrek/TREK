import StudioShell from '../components/Studio/StudioShell'

/**
 * TREK Studio, the Journey book designer.
 *
 * A child route of /journey/:id rather than a page of its own: the journey stays
 * mounted and shows through behind the panel, so Studio reads as something you
 * opened on top of the journey instead of somewhere you navigated away to. The
 * URL exists so a reload, the back button and a shared link all still work — the
 * user never sees it.
 */
export default function JourneyStudioPage() {
  return <StudioShell />
}
