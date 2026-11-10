package com.liketrek.trek;

import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.KeyboardShortcutGroup;
import android.view.Menu;
import android.view.View;
import com.getcapacitor.BridgeActivity;
import com.liketrek.trek.screen.TrekKeyCommands;
import com.liketrek.trek.tiles.TrekTileStore;
import com.liketrek.trek.widget.TrekWidgetUpdater;
import java.util.List;

public class MainActivity extends BridgeActivity {

    /** The share sheet (share/ShareActivity.kt) left an item for the import. */
    public static final String ACTION_SHARE_HANDOFF = "com.liketrek.trek.SHARE_HANDOFF";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TrekShellPlugin.class);
        TrekTileStore.INSTANCE.init(this);
        // With a server picked, the WebView loads that server instead of the
        // bundled address screen, so the UI arrives in the version the server
        // runs and on its own origin. BridgeActivity reads `config` while it
        // builds the bridge inside super.onCreate().
        boolean restarting = TrekServerStore.consumeRestart(this);
        TrekServerStore.recheckAfterUpdate(this);
        String server = TrekServerStore.getUrl(this);
        boolean onServer = server != null && !TrekServerStore.consumeShellOnce(this);
        config = TrekServerStore.configFor(this, onServer ? server : null, restarting);
        super.onCreate(savedInstanceState);
        if (bridge == null) return;
        // The UI asks for no overscroll effect (overscroll-behavior: none on html)
        // and Chrome honours that, but the WebView draws the stretch on its root
        // scroller natively. It scales the whole view, top bar and bottom dock included.
        bridge.getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        // Set before any WebView callback can run: they are posted to this thread.
        if (onServer) bridge.setWebViewClient(new TrekWebViewClient(bridge, this::showAddressScreen, TrekServerStore.getSignInHosts(this)));
        TrekSharedFiles.receive(this, getIntent());
        // Android 15's widget picker draws the widgets live from a sample trip.
        TrekWidgetUpdater.publishPreviews(this);
    }

    /**
     * A hardware keyboard's shortcut runs the UI's command (TrekKeyCommands),
     * wherever the focus is; everything else goes on to the WebView as usual.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (TrekKeyCommands.INSTANCE.dispatch(event)) return true;
        return super.dispatchKeyEvent(event);
    }

    /** The UI's shortcuts in the system's list (Meta + /), under their names. */
    @Override
    public void onProvideKeyboardShortcuts(List<KeyboardShortcutGroup> data, Menu menu, int deviceId) {
        super.onProvideKeyboardShortcuts(data, menu, deviceId);
        KeyboardShortcutGroup group = TrekKeyCommands.INSTANCE.shortcutGroup(getString(R.string.app_name));
        if (group != null) data.add(group);
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        TrekSharedFiles.receive(this, intent);
    }

    private boolean leavingServer;

    /**
     * The server did not load: back to the address screen, which offers retry
     * and change. A fresh task rather than recreate(), because this usually
     * happens during launch, while the system splash is still up, and a
     * recreated activity leaves that splash lying over the new page.
     */
    private void showAddressScreen() {
        // A failed page can report more than one error; restart only once.
        if (leavingServer) return;
        leavingServer = true;
        TrekServerStore.showShellOnce(this);
        TrekServerStore.markRestart(this);
        runOnUiThread(() -> {
            startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
            overridePendingTransition(0, 0);
        });
    }
}
