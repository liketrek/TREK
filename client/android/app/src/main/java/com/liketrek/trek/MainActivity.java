package com.liketrek.trek;

import android.content.Intent;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.KeyboardShortcutGroup;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
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
        if (onServer) {
            bridge.setWebViewClient(
                new TrekWebViewClient(bridge, this::showAddressScreen, this::showSignInBar, TrekServerStore.getSignInHosts(this))
            );
        }
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

    private View signInBar;
    /** Whether the page is a proxy's sign-in page, and whether the keyboard is up over it. */
    private boolean onSignInPage;
    private boolean keyboardUp;

    /**
     * Over a proxy's sign-in page (Pangolin, authentik, ...): the server's UI is
     * not there, so nothing else would lead back to the address screen, and a
     * passkey cannot work in a web view for a domain the app is not tied to.
     * The bar says so and offers to change the server.
     */
    private void showSignInBar(boolean show) {
        runOnUiThread(() -> {
            onSignInPage = show;
            if (show && signInBar == null) signInBar = buildSignInBar();
            updateSignInBar();
        });
    }

    /** Out of the way while the keyboard is up: the form needs the room, and the bar is there again once it closes. */
    private void updateSignInBar() {
        if (signInBar != null) signInBar.setVisibility(onSignInPage && !keyboardUp ? View.VISIBLE : View.GONE);
    }

    private View buildSignInBar() {
        float dp = getResources().getDisplayMetrics().density;
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(Math.round(14 * dp), Math.round(10 * dp), Math.round(8 * dp), Math.round(10 * dp));
        GradientDrawable background = new GradientDrawable();
        background.setColor(0xF2111827);
        background.setCornerRadius(16 * dp);
        bar.setBackground(background);
        bar.setElevation(6 * dp);

        TextView hint = new TextView(this);
        hint.setText(TrekServerStore.signInHintLabel(this));
        hint.setTextColor(0xFFE5E7EB);
        hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f);
        bar.addView(hint, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button change = new Button(this, null, android.R.attr.borderlessButtonStyle);
        change.setText(TrekServerStore.changeServerLabel(this));
        change.setAllCaps(false);
        change.setTextColor(0xFFFFFFFF);
        change.setOnClickListener((v) -> {
            TrekServerStore.setUrl(this, null);
            TrekServerStore.markRestart(this);
            recreate();
        });
        bar.addView(change, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        int margin = Math.round(12 * dp);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM
        );
        params.setMargins(margin, 0, margin, margin);
        FrameLayout root = findViewById(android.R.id.content);
        root.addView(bar, params);
        // Above the gesture bar, and above the keyboard while it is up.
        bar.setOnApplyWindowInsetsListener((v, insets) -> {
            boolean modern = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R;
            int bottom = modern ? insets.getInsets(WindowInsets.Type.systemBars()).bottom : insets.getStableInsetBottom();
            boolean imeVisible = modern ? insets.isVisible(WindowInsets.Type.ime()) : insets.getSystemWindowInsetBottom() > bottom * 3;
            if (imeVisible != keyboardUp) {
                keyboardUp = imeVisible;
                updateSignInBar();
            }
            FrameLayout.LayoutParams p = (FrameLayout.LayoutParams) v.getLayoutParams();
            if (p.bottomMargin != margin + bottom) {
                p.bottomMargin = margin + bottom;
                v.setLayoutParams(p);
            }
            return insets;
        });
        bar.requestApplyInsets();
        return bar;
    }

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
