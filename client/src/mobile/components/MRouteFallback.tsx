/**
 * Placeholder while a route chunk is in flight — the phone counterpart to
 * RouteFallback in App.tsx. It carries m-root itself, because it renders outside
 * MobileShell and the --m-* tokens would not resolve otherwise.
 *
 * An outline rather than a spinner: on a phone an empty screen is the loudest
 * state the app has, and a pulsing silhouette of what is about to arrive reads
 * as "loading" instead of "broken".
 */
export default function MRouteFallback() {
  return (
    <div className="m-root flex h-dvh flex-col gap-3 px-4 pt-14 bg-[color:var(--m-bg)]">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-m-card" />
      <div className="h-28 animate-pulse rounded-xl bg-m-card" />
      <div className="h-28 animate-pulse rounded-xl bg-m-card" />
      <div className="h-28 animate-pulse rounded-xl bg-m-card" />
    </div>
  )
}
