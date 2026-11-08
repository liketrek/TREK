import { hostActions } from '../../lib/host';
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
          onOpen={hostActions(app).open}
          // The trip goes to the model by its id alone: its title is a traveller's text, and it
          // must not reach the model as if it were an instruction.
          onSelect={(trip) =>
            void app
              ?.updateModelContext({
                content: [{ type: 'text', text: `The user picked the trip with tripId ${trip.id}.` }],
                structuredContent: { tripId: trip.id },
              })
              .catch(() => undefined)
          }
        />
      )}
    </WidgetState>
  );
}
