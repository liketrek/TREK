import { hostActions, trekToolSucceeded } from '../../lib/host';
import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { PackingList } from './PackingList';

/**
 * The packing widget: list_packing_items' checklist. A tick goes through the
 * host's own MCP session (toggle_packing_item), so TREK checks the permission
 * and writes the audit row as for any other call.
 */
export function App() {
  const state = useTrekApp('packing');
  const { app, locale, t } = state;
  const host = hostActions(app);
  return (
    <WidgetState state={state}>
      {(result) => (
        <PackingList
          data={result.structuredContent}
          appUrl={result.appUrl}
          locale={locale}
          t={t}
          onOpen={host.open}
          // A host without a fullscreen mode refuses; the list then unfolds where it is.
          onExpand={() => void host.expand()}
          onToggle={(item, checked) =>
            trekToolSucceeded(app, 'toggle_packing_item', { tripId: item.trip_id, itemId: item.id, checked })
          }
        />
      )}
    </WidgetState>
  );
}
