package com.liketrek.trek;

import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/** The native half of client/src/native/trekShell.ts. */
@CapacitorPlugin(name = "TrekShell")
public class TrekShellPlugin extends Plugin {

    /** How long to wait after returning from the browser for the redirect to land. */
    private static final long CANCEL_GRACE_MS = 600;

    private String authCallId;
    private String authScheme;
    private boolean authBrowserOpen;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void getServer(PluginCall call) {
        String url = TrekServerStore.getUrl(getContext());
        JSObject result = new JSObject();
        result.put("url", url == null ? JSONObject.NULL : url);
        call.resolve(result);
    }

    @PluginMethod
    public void setServer(PluginCall call) {
        String url = call.getString("url");
        Uri parsed = url == null ? null : Uri.parse(url);
        if (parsed == null || parsed.getHost() == null || !("https".equals(parsed.getScheme()) || "http".equals(parsed.getScheme()))) {
            call.reject("A http(s) URL is required");
            return;
        }
        TrekServerStore.setUrl(getContext(), url);
        call.resolve();
        restart();
    }

    @PluginMethod
    public void resetServer(PluginCall call) {
        TrekServerStore.setUrl(getContext(), null);
        call.resolve();
        restart();
    }

    @PluginMethod
    public void reload(PluginCall call) {
        call.resolve();
        restart();
    }

    /** The server URL is part of the bridge's configuration, so it takes a new activity. */
    private void restart() {
        getActivity().runOnUiThread(() -> getActivity().recreate());
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        String url = call.getString("url");
        String scheme = call.getString("callbackScheme");
        if (url == null || scheme == null) {
            call.reject("url and callbackScheme are required");
            return;
        }
        rejectPendingAuth("Superseded by a new sign-in");
        call.setKeepAlive(true);
        getBridge().saveCall(call);
        authCallId = call.getCallbackId();
        authScheme = scheme;
        authBrowserOpen = true;
        // A Custom Tab shares the browser's cookies, so a running SSO session at
        // the identity provider carries over. The redirect back to the app's
        // scheme arrives through the intent-filter in AndroidManifest.xml.
        new CustomTabsIntent.Builder().build().launchUrl(getActivity(), Uri.parse(url));
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        Uri data = intent.getData();
        PluginCall call = pendingAuthCall();
        if (call == null || data == null || !authScheme.equals(data.getScheme())) return;
        JSObject result = new JSObject();
        result.put("url", data.toString());
        call.resolve(result);
        finishAuth(call);
    }

    /**
     * Back in the app without a redirect means the user closed the browser.
     * onNewIntent runs before onResume when the redirect did arrive, so the
     * grace period only covers devices that deliver the two out of order.
     */
    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (!authBrowserOpen) return;
        authBrowserOpen = false;
        handler.postDelayed(() -> {
            PluginCall call = pendingAuthCall();
            if (call == null) return;
            call.reject("Sign-in cancelled", "CANCELLED");
            finishAuth(call);
        }, CANCEL_GRACE_MS);
    }

    private PluginCall pendingAuthCall() {
        return authCallId == null ? null : getBridge().getSavedCall(authCallId);
    }

    private void rejectPendingAuth(String message) {
        PluginCall call = pendingAuthCall();
        if (call == null) return;
        call.reject(message, "CANCELLED");
        finishAuth(call);
    }

    private void finishAuth(PluginCall call) {
        getBridge().releaseCall(call);
        authCallId = null;
        authScheme = null;
        authBrowserOpen = false;
    }

    /** iOS only: Android keeps the service worker, which already starts TREK offline. */
    @PluginMethod
    public void refreshOfflineCopy(PluginCall call) {
        JSObject result = new JSObject();
        result.put("saved", false);
        call.resolve(result);
    }

    @PluginMethod
    public void openOfflineCopy(PluginCall call) {
        JSObject result = new JSObject();
        result.put("opened", false);
        call.resolve(result);
    }
}
