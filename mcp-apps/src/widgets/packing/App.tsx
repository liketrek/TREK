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
  return (
    <WidgetState state={state}>
      {(result) => (
        <PackingList
          data={result.structuredContent}
          appUrl={result.appUrl}
          locale={locale}
          t={t}
          onOpen={(url) => void app?.openLink({ url })}
          // A host without a fullscreen mode refuses; the list then unfolds where it is.
          onExpand={() => void app?.requestDisplayMode({ mode: 'fullscreen' }).catch(() => undefined)}
          onToggle={async (item, checked) => {
            if (!app) return false;
            try {
              const answer = await app.callServerTool({
                name: 'toggle_packing_item',
                arguments: { tripId: item.trip_id, itemId: item.id, checked },
              });
              return !answer.isError;
            } catch {
              return false;
            }
          }}
        />
      )}
    </WidgetState>
  );
}
