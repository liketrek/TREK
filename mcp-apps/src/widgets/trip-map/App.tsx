import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { TripMap } from './TripMap';

/** The map widget: get_trip_map's places, its further pages read through the host's own session. */
export function App() {
  const state = useTrekApp('trip-map');
  const { app, input, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <TripMap
          data={result.structuredContent}
          locale={locale}
          t={t}
          loadPage={async (offset) => {
            if (!app || typeof input?.tripId !== 'number') throw new Error('no trip to read');
            const answer = await app.callServerTool({
              name: 'get_trip_map',
              arguments: { tripId: input.tripId, offset },
            });
            if (answer.isError) throw new Error('refused');
            return answer.structuredContent;
          }}
          // The place is the reader's own trip data; it goes to the model as context, never as their message.
          onSelect={(place) =>
            void app?.updateModelContext({ structuredContent: { selectedPlace: { id: place.id, name: place.name } } })
          }
          onExpand={async () => {
            const granted = await app?.requestDisplayMode({ mode: 'fullscreen' }).catch(() => null);
            return granted?.mode === 'fullscreen';
          }}
        />
      )}
    </WidgetState>
  );
}
