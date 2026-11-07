import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { PlaceResults } from './PlaceResults';

/**
 * The place-results widget. "Add to trip" asks the assistant in the user's
 * voice, naming the place by its id alone: the name and address come from a
 * search index, and third-party text must not ride along as an instruction.
 */
export function App() {
  const state = useTrekApp('place-results');
  const { app, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <PlaceResults
          data={result.structuredContent}
          locale={locale}
          t={t}
          onAdd={(placeId) =>
            void app?.sendMessage({
              role: 'user',
              content: [{ type: 'text', text: t('mcpApps.places.addAsk').replace('{id}', placeId) }],
            })
          }
          onSelect={(place, placeId) =>
            void app?.updateModelContext({ structuredContent: { selectedPlace: { id: placeId, name: place.name } } })
          }
        />
      )}
    </WidgetState>
  );
}
