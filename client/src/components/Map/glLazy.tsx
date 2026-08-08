import { lazyWithRetry } from '../../utils/lazyWithRetry'

/**
 * The six ways into a GL map, one chunk per engine.
 *
 * mapbox-gl and maplibre-gl used to be static imports inside MapViewGL,
 * JourneyMapGL and the settings preview, so rollup put both SDKs into a single
 * 2.8 MB chunk. Every map user downloaded 1.8 MB of mapbox plus 1.1 MB of
 * maplibre and then ran exactly one of them.
 *
 * Pairing the component with its engine behind the lazy boundary is what
 * separates them: no module reaches both SDKs statically any more, so rolldown
 * emits one shared core chunk and two engine chunks. The engine arrives as a
 * prop — see the `gl` prop on each component.
 *
 * Both imports start together rather than in sequence: the engine is by far the
 * larger of the two, and waiting for the component first would add its round
 * trip in front of the download that actually costs time.
 */

export const MapViewGLMapbox = lazyWithRetry(async () => {
  const [component, engine] = await Promise.all([import('./MapViewGL'), import('./engines/mapbox')])
  const MapViewGL = component.MapViewGL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { default: (props: any) => <MapViewGL {...props} gl={engine.default} /> }
})

export const MapViewGLMaplibre = lazyWithRetry(async () => {
  const [component, engine] = await Promise.all([import('./MapViewGL'), import('./engines/maplibre')])
  const MapViewGL = component.MapViewGL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { default: (props: any) => <MapViewGL {...props} gl={engine.default} /> }
})

export const JourneyMapGLMapbox = lazyWithRetry(async () => {
  const [component, engine] = await Promise.all([
    import('../Journey/JourneyMapGL'),
    import('./engines/mapbox'),
  ])
  const JourneyMapGL = component.default
  // The journey map exposes an imperative handle (highlightMarker / focusMarker /
  // invalidateSize). Since React 19 its ref is an ordinary prop, so it rides
  // through the spread and the binding needs no forwardRef wrapper.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { default: (props: any) => <JourneyMapGL {...props} gl={engine.default} /> }
})

export const JourneyMapGLMaplibre = lazyWithRetry(async () => {
  const [component, engine] = await Promise.all([
    import('../Journey/JourneyMapGL'),
    import('./engines/maplibre'),
  ])
  const JourneyMapGL = component.default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { default: (props: any) => <JourneyMapGL {...props} gl={engine.default} /> }
})

export const GlMapPreviewMapbox = lazyWithRetry(async () => {
  const [component, engine] = await Promise.all([
    import('../Settings/MapboxPreview'),
    import('./engines/mapbox'),
  ])
  const GlMapPreview = component.default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { default: (props: any) => <GlMapPreview {...props} gl={engine.default} /> }
})

export const GlMapPreviewMaplibre = lazyWithRetry(async () => {
  const [component, engine] = await Promise.all([
    import('../Settings/MapboxPreview'),
    import('./engines/maplibre'),
  ])
  const GlMapPreview = component.default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { default: (props: any) => <GlMapPreview {...props} gl={engine.default} /> }
})
