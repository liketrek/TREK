import { hostActions } from '../../lib/host';
import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { TripOverview } from './TripOverview';

/** The trip-overview widget: get_trip_overview's card, with a way to ask about one of the next days. */
export function App() {
  const state = useTrekApp('trip-overview');
  const { app, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <TripOverview
          data={result.structuredContent}
          appUrl={result.appUrl}
          locale={locale}
          t={t}
          onOpen={hostActions(app).open}
          onShowDay={(_day, reference) =>
            void app
              ?.sendMessage({
                role: 'user',
                content: [{ type: 'text', text: t('mcpApps.overview.askDay', { day: reference }) }],
              })
              .catch(() => undefined)
          }
        />
      )}
    </WidgetState>
  );
}
