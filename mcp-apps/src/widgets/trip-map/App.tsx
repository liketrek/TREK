import { hostActions, readTrekTool } from '../../lib/host';
import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { TripMap } from './TripMap';

/** The map widget: get_trip_map's places, its further pages read through the host's own session. */
export function App() {
  const state = useTrekApp('trip-map');
  const { app, input, displayMode, locale, t } = state;
  const host = hostActions(app);
  return (
    <WidgetState state={state}>
      {(result) => (
        <TripMap
          data={result.structuredContent}
          locale={locale}
          t={t}
          fullscreen={displayMode === undefined ? undefined : displayMode === 'fullscreen'}
          loadPage={async (offset) => {
            if (typeof input?.tripId !== 'number') throw new Error('no trip to read');
            return readTrekTool(app, 'get_trip_map', { tripId: input.tripId, offset });
          }}
          // The place goes to the model by its id alone: any member of the trip may have named
          // it, and that text must not reach the model as if it were an instruction.
          onSelect={(place) =>
            void app?.updateModelContext({ structuredContent: { selectedPlaceId: place.id } }).catch(() => undefined)
          }
          onExpand={host.expand}
        />
      )}
    </WidgetState>
  );
}
