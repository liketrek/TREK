import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { TripList } from './TripList';

/** The trip-list widget: list_trips' result as cards, a link into TREK, and a way to point the model at one trip. */
export function App() {
  const state = useTrekApp('trip-list');
  const { app, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <TripList
          data={result.structuredContent}
          appUrl={result.appUrl}
          locale={locale}
          t={t}
          onOpen={(url) => void app?.openLink({ url })}
          onSelect={(trip) =>
            void app?.updateModelContext({
              content: [{ type: 'text', text: `The user picked the trip "${trip.title}" (tripId ${trip.id}).` }],
              structuredContent: { tripId: trip.id, title: trip.title },
            })
          }
        />
      )}
    </WidgetState>
  );
}
