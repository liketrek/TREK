import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { Weather } from './Weather';

/** The weather widget: get_weather's forecast as a card. Read only. */
export function App() {
  const state = useTrekApp('weather');
  return (
    <WidgetState state={state}>
      {(result) => <Weather data={result.structuredContent} input={state.input} locale={state.locale} t={state.t} />}
    </WidgetState>
  );
}
