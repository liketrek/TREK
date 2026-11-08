package com.liketrek.trek;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONObject;

/** The native half of client/src/native/trekShell.ts. */
@CapacitorPlugin(
    name = "TrekShell",
    permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications"),
        @Permission(strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION }, alias = "location"),
    }
)
public class TrekShellPlugin extends Plugin {

    private static final String TAG = "TrekShell";

    /** How long to wait after returning from the browser for the redirect to land. */
    private static final long CANCEL_GRACE_MS = 600;

    private String authCallId;
    private String authScheme;
    private boolean authBrowserOpen;
    private final Handler handler = new Handler(Looper.getMainLooper());

    /**
     * What this binary offers the server's UI, raised with every native feature
     * an older binary lacks. The UI asks before it calls (native/capabilities.ts),
     * and a server can require a minimum (minNativeShellApi in /api/health/features).
     */
    static final int SHELL_API = 2;
    /** The native features by name, so the UI can turn each on by itself. */
    static final String[] FEATURES = {
        "capabilities",
        "biometricLock",
        "sharedFiles",
        "nativePush",
        "geolocation",
        "tileCache",
        "widgets",
        "widgetTrips",
        "liveActivity",
        "shareSheet",
        "playBilling",
        "googleWallet",
        "keyCommands",
        "windowLayout",
    };

    /** liketrek's push relay: the endpoint for this device's FCM token (trek-hosted push-relay.ts). */
    static final String PUSH_RELAY = "https://push.liketrek.com/v1/fcm/";

    /** The notification the app was started from, until the UI asks for it. */
    private String openedPushUrl;

    @PluginMethod
    public void getCapabilities(PluginCall call) {
        JSObject result = new JSObject();
        result.put("shellApi", SHELL_API);
        result.put("platform", "android");
        String version = "";
        String build = "";
        try {
            android.content.pm.PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            version = info.versionName == null ? "" : info.versionName;
            build = String.valueOf(androidx.core.content.pm.PackageInfoCompat.getLongVersionCode(info));
        } catch (android.content.pm.PackageManager.NameNotFoundException ignored) {
            // Our own package is always there; the fields simply stay empty.
        }
        result.put("appVersion", version);
        result.put("build", build);
        com.getcapacitor.JSArray features = new com.getcapacitor.JSArray();
        for (String feature : FEATURES) features.put(feature);
        result.put("features", features);
        call.resolve(result);
    }

    // ---- Shared booking documents ----

    @Override
    public void load() {
        TrekSharedFiles.setListener(file -> notifyListeners("sharedFile", file));
        // A reloaded page starts without a stream; whatever the old one ran is stopped.
        if (location != null) location.stop();
        locationActive = false;
        // A pending purchase that cleared while the shell runs: redeemed like a restore.
        com.liketrek.trek.billing.TrekBilling.INSTANCE.setOnTransaction(receipt -> {
            notifyListeners("storeTransaction", receipt);
            return kotlin.Unit.INSTANCE;
        });
        com.liketrek.trek.screen.TrekKeyCommands.INSTANCE.setOnPress(id -> {
            JSObject pressed = new JSObject();
            pressed.put("id", id);
            notifyListeners("keyCommand", pressed);
            return kotlin.Unit.INSTANCE;
        });
        if (getActivity() != null) {
            com.liketrek.trek.screen.TrekWindowLayout.INSTANCE.observe(getActivity(), layout -> {
                notifyListeners("windowLayout", layout);
                return kotlin.Unit.INSTANCE;
            });
        }
        if (getActivity() != null && getActivity().getIntent() != null) {
            openedPushUrl = getActivity().getIntent().getStringExtra(TrekPushService.EXTRA_URL);
            getActivity().getIntent().removeExtra(TrekPushService.EXTRA_URL);
        }
    }

    // ---- Push ----

    /**
     * Permission, the FCM token and the device keys, as the Web Push subscription
     * the server stores (native/push.ts). Rejects with DENIED when the user
     * refuses notifications, as on iOS.
     */
    @PluginMethod
    public void registerPush(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "pushPermissionAnswered");
            return;
        }
        subscribePush(call);
    }

    @PermissionCallback
    private void pushPermissionAnswered(PluginCall call) {
        if (getPermissionState("notifications") != PermissionState.GRANTED) {
            call.reject("Notifications are not allowed", "DENIED");
            return;
        }
        subscribePush(call);
    }

    private void subscribePush(PluginCall call) {
        if (!NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
            call.reject("Notifications are not allowed", "DENIED");
            return;
        }
        TrekPushService.ensureChannel(getContext());
        final TrekPushKeys keys;
        try {
            keys = TrekPushKeys.loadOrCreate(getContext());
        } catch (Exception e) {
            call.reject("Could not create the push keys", e);
            return;
        }
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || task.getResult() == null) {
                call.reject("Could not get a push token", task.getException());
                return;
            }
            JSObject subscription = new JSObject();
            subscription.put("endpoint", PUSH_RELAY + task.getResult());
            JSObject keyObject = new JSObject();
            keyObject.put("p256dh", TrekPushKeys.base64url(keys.publicKey));
            keyObject.put("auth", TrekPushKeys.base64url(keys.auth));
            subscription.put("keys", keyObject);
            call.resolve(subscription);
        });
    }

    @PluginMethod
    public void takeOpenedPush(PluginCall call) {
        JSObject result = new JSObject();
        result.put("url", openedPushUrl == null ? JSONObject.NULL : openedPushUrl);
        openedPushUrl = null;
        call.resolve(result);
    }

    /** The document shared to TREK before the UI was there to hear of it. */
    @PluginMethod
    public void takeSharedFile(PluginCall call) {
        JSObject result = new JSObject();
        JSObject file = TrekSharedFiles.take();
        result.put("file", file == null ? JSONObject.NULL : file);
        call.resolve(result);
    }

    // ---- App lock ----

    private static final int AUTHENTICATORS =
        androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
            | androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL;

    /** Which biometry the device offers for the app lock, if any. */
    @PluginMethod
    public void biometryInfo(PluginCall call) {
        int status = androidx.biometric.BiometricManager.from(getContext()).canAuthenticate(AUTHENTICATORS);
        JSObject result = new JSObject();
        result.put("available", status == androidx.biometric.BiometricManager.BIOMETRIC_SUCCESS);
        result.put("type", "biometric");
        call.resolve(result);
    }

    /** The system biometric prompt with the screen lock as the way out. */
    @PluginMethod
    public void authenticateBiometric(PluginCall call) {
        String reason = call.getString("reason", "Unlock TREK");
        getActivity().runOnUiThread(() -> {
            androidx.fragment.app.FragmentActivity activity = (androidx.fragment.app.FragmentActivity) getActivity();
            androidx.biometric.BiometricPrompt prompt = new androidx.biometric.BiometricPrompt(
                activity,
                androidx.core.content.ContextCompat.getMainExecutor(getContext()),
                new androidx.biometric.BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(androidx.biometric.BiometricPrompt.AuthenticationResult result) {
                        JSObject ok = new JSObject();
                        ok.put("ok", true);
                        call.resolve(ok);
                    }

                    @Override
                    public void onAuthenticationError(int code, CharSequence message) {
                        boolean cancelled = code == androidx.biometric.BiometricPrompt.ERROR_USER_CANCELED
                            || code == androidx.biometric.BiometricPrompt.ERROR_NEGATIVE_BUTTON
                            || code == androidx.biometric.BiometricPrompt.ERROR_CANCELED;
                        call.reject(message.toString(), cancelled ? "CANCELLED" : "FAILED");
                    }
                }
            );
            androidx.biometric.BiometricPrompt.PromptInfo info = new androidx.biometric.BiometricPrompt.PromptInfo.Builder()
                .setTitle(reason)
                .setAllowedAuthenticators(AUTHENTICATORS)
                .build();
            prompt.authenticate(info);
        });
    }

    /** While on, the recent-apps screen shows no snapshot of the app. */
    @PluginMethod
    public void setPrivacyCover(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        getActivity().runOnUiThread(() -> {
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                getActivity().setRecentsScreenshotEnabled(!enabled);
            } else if (enabled) {
                getActivity().getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
            } else {
                getActivity().getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
            }
        });
        call.resolve();
    }

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
        TrekServerStore.setServer(getContext(), url, signInHostsOf(call));
        // A TREK Cloud purchase: the code that signs the buyer in, opened once after the first page.
        String welcome = call.getString("welcome");
        TrekServerStore.setWelcome(getContext(), welcome != null && welcome.matches("[A-Za-z0-9_-]{43}") ? welcome : null);
        call.resolve();
        restart();
    }

    /** The sign-in hosts the address screen passes along, plain host names only. */
    private static Set<String> signInHostsOf(PluginCall call) {
        Set<String> hosts = new HashSet<>();
        JSArray list = call.getArray("signInHosts");
        if (list == null) return hosts;
        for (int i = 0; i < list.length(); i++) {
            String host = list.optString(i, "");
            if (host.matches("[A-Za-z0-9.-]+(:[0-9]+)?")) hosts.add(host);
        }
        return hosts;
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
        locationActive = false;
        if (location != null) location.stop();
        TrekServerStore.markRestart(getContext());
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
        Uri target = Uri.parse(url);
        getActivity().runOnUiThread(() -> openSignIn(target));
    }

    /**
     * Opens the sign-in in a Custom Tab, or in the browser itself where no
     * Custom Tab can come up. Launched on the UI thread: some devices dropped a
     * launch from the bridge's thread without a word, and the sign-in then
     * looked cancelled. A browser that cannot open at all is reported as such.
     */
    private void openSignIn(Uri target) {
        try {
            new CustomTabsIntent.Builder().build().launchUrl(getActivity(), target);
            return;
        } catch (RuntimeException tabFailed) {
            Log.w(TAG, "No Custom Tab for the sign-in, trying the browser", tabFailed);
        }
        try {
            getActivity().startActivity(new Intent(Intent.ACTION_VIEW, target).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (RuntimeException browserFailed) {
            Log.w(TAG, "No browser for the sign-in", browserFailed);
            PluginCall call = pendingAuthCall();
            if (call == null) return;
            call.reject("No browser could open the sign-in", "NO_BROWSER");
            finishAuth(call);
        }
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        String pushUrl = intent.getStringExtra(TrekPushService.EXTRA_URL);
        if (pushUrl != null) {
            intent.removeExtra(TrekPushService.EXTRA_URL);
            JSObject opened = new JSObject();
            opened.put("url", pushUrl);
            notifyListeners("pushOpened", opened);
            return;
        }
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
        if (locationActive && location != null && locationAllowed()) location.start(locationHighAccuracy);
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

    // ---- Widgets, shortcuts and the travel day ----

    /**
     * What the home-screen widgets show (native/widgets.ts), as JSON: "snapshot"
     * (the dashboard's), "trip.<id>" or "trips" (the list a widget and the share
     * sheet pick from). The widgets redraw, and a new trip list rebuilds the
     * trip shortcuts.
     */
    @PluginMethod
    public void setWidgetSnapshot(PluginCall call) {
        String json = call.getString("json");
        String key = call.getString("key", "snapshot");
        if (json == null) {
            call.reject("json is required");
            return;
        }
        if (!com.liketrek.trek.widget.WidgetStore.INSTANCE.isValidKey(key)) {
            call.reject("key must be snapshot, trips or trip.<id>");
            return;
        }
        android.content.Context context = getContext().getApplicationContext();
        try {
            com.liketrek.trek.widget.WidgetStore.INSTANCE.write(context, key, json);
        } catch (Exception e) {
            call.reject("Could not store the widget snapshot", e);
            return;
        }
        if ("trips".equals(key)) {
            new Thread(() -> com.liketrek.trek.share.TrekShortcuts.INSTANCE.publish(context)).start();
        } else {
            com.liketrek.trek.widget.TrekWidgetUpdater.refreshAll(context);
        }
        call.resolve();
    }

    /** Starts the travel day's Live Update, or updates the one showing. */
    @PluginMethod
    public void syncTripDay(PluginCall call) {
        String title = call.getString("tripTitle");
        String path = call.getString("path");
        String dayLabel = call.getString("dayLabel");
        String nextName = call.getString("nextName");
        if (title == null || path == null || dayLabel == null || nextName == null) {
            call.reject("tripTitle, path, dayLabel and nextName are required");
            return;
        }
        java.util.List<String> colors = new java.util.ArrayList<>();
        com.getcapacitor.JSArray raw = call.getArray("colors");
        if (raw != null) {
            for (int i = 0; i < raw.length(); i++) colors.add(raw.isNull(i) ? null : raw.optString(i, null));
        }
        com.liketrek.trek.tripday.TripDayNotification.State state = new com.liketrek.trek.tripday.TripDayNotification.State(
            title,
            path,
            dayLabel,
            nextName,
            call.getString("nextTime"),
            call.getInt("nextMinutes"),
            call.getInt("done", 0),
            call.getInt("total", 0),
            colors
        );
        boolean running = com.liketrek.trek.tripday.TripDayNotification.INSTANCE.show(getContext(), state);
        JSObject result = new JSObject();
        result.put("running", running);
        call.resolve(result);
    }

    @PluginMethod
    public void endTripDay(PluginCall call) {
        com.liketrek.trek.tripday.TripDayNotification.INSTANCE.end(getContext());
        call.resolve();
    }

    // ---- Location ----

    private com.liketrek.trek.location.TrekLocation location;
    private boolean locationHighAccuracy;

    private com.liketrek.trek.location.TrekLocation location() {
        if (location == null) {
            location = new com.liketrek.trek.location.TrekLocation(getContext(), payload -> {
                notifyListeners("location", payload);
                return kotlin.Unit.INSTANCE;
            });
        }
        return location;
    }

    /** Whether the app may know where the device is: precisely, or "Approximate" only. */
    private boolean locationAllowed() {
        return androidx.core.content.ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION)
                == android.content.pm.PackageManager.PERMISSION_GRANTED
            || androidx.core.content.ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION)
                == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    /** True while the UI has a stream running, so it resumes after the app was in the background. */
    private boolean locationActive;

    /**
     * One location stream for the UI's navigator.geolocation, asking for the
     * permission the first time. "Approximate" counts as allowed; the stream then
     * runs on the coarse fixes Android gives.
     */
    @PluginMethod
    public void startLocation(PluginCall call) {
        locationHighAccuracy = Boolean.TRUE.equals(call.getBoolean("highAccuracy", false));
        if (!locationAllowed()) {
            requestPermissionForAlias("location", call, "locationPermissionAnswered");
            return;
        }
        locationActive = true;
        location().start(locationHighAccuracy);
        call.resolve();
    }

    @PermissionCallback
    private void locationPermissionAnswered(PluginCall call) {
        if (!locationAllowed()) {
            location().emitError(1, "Location permission denied");
        } else {
            locationActive = true;
            location().start(locationHighAccuracy);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopLocation(PluginCall call) {
        locationActive = false;
        if (location != null) location.stop();
        call.resolve();
    }

    /** No location in the background, as in a browser: paused with the app, resumed with it. */
    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (location != null) location.stop();
    }

    /** The page and the activity are gone: nothing can stop the stream any more but this. */
    @Override
    protected void handleOnDestroy() {
        locationActive = false;
        if (location != null) location.stop();
        super.handleOnDestroy();
    }

    // ---- Map tile store ----

    @PluginMethod
    public void getTileCacheUsage(PluginCall call) {
        new Thread(() -> {
            JSObject result = new JSObject();
            result.put("bytes", com.liketrek.trek.tiles.TrekTileStore.INSTANCE.usage());
            result.put("limit", com.liketrek.trek.tiles.TrekTileStore.MAX_BYTES);
            call.resolve(result);
        }).start();
    }

    @PluginMethod
    public void clearTileCache(PluginCall call) {
        new Thread(() -> {
            com.liketrek.trek.tiles.TrekTileStore.INSTANCE.clear();
            call.resolve();
        }).start();
    }

    // ---- Google Play Billing (the StoreKit methods' Android side) ----

    @PluginMethod
    public void storeProducts(PluginCall call) {
        com.liketrek.trek.billing.TrekBilling.INSTANCE.products(getContext(), call);
    }

    @PluginMethod
    public void storePurchase(PluginCall call) {
        com.liketrek.trek.billing.TrekBilling.INSTANCE.purchase(getActivity(), call);
    }

    @PluginMethod
    public void storeFinish(PluginCall call) {
        com.liketrek.trek.billing.TrekBilling.INSTANCE.finish(getContext(), call);
    }

    @PluginMethod
    public void storeRestore(PluginCall call) {
        com.liketrek.trek.billing.TrekBilling.INSTANCE.restore(getContext(), call);
    }

    /** A paid subscription never delivered (it cleared while the app was closed), for the shell to redeem. */
    @PluginMethod
    public void storeUnfinished(PluginCall call) {
        com.liketrek.trek.billing.TrekBilling.INSTANCE.unfinished(getContext(), call);
    }

    // ---- Google Wallet ----

    /** The only links this hands on: Google Wallet's save-to-wallet page. */
    static final String GOOGLE_WALLET_SAVE = "https://pay.google.com/gp/v/save/";

    /**
     * Feature googleWallet: a booking's pass, by the save link the TREK services
     * signed, into Google Wallet. The Wallet app takes the link where it is
     * installed, the browser otherwise.
     */
    @PluginMethod
    public void addToGoogleWallet(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !url.startsWith(GOOGLE_WALLET_SAVE)) {
            call.reject("not a Google Wallet save link", "INVALID");
            return;
        }
        try {
            getActivity().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE));
            JSObject result = new JSObject();
            result.put("result", "opened");
            call.resolve(result);
        } catch (android.content.ActivityNotFoundException e) {
            call.reject("Nothing can open Google Wallet", "UNAVAILABLE");
        }
    }

    // ---- Large screens and keyboards ----

    /** Feature keyCommands: the UI's keyboard shortcuts for the screen it shows. */
    @PluginMethod
    public void setKeyCommands(PluginCall call) {
        com.liketrek.trek.screen.TrekKeyCommands.INSTANCE.set(call.getArray("commands"));
        call.resolve();
    }

    /** Feature windowLayout: the window's size classes and a foldable's posture and hinge. */
    @PluginMethod
    public void getWindowLayout(PluginCall call) {
        // The last layout WindowManager reported, posture and hinge included; the bare window before the first.
        getActivity().runOnUiThread(() -> call.resolve(com.liketrek.trek.screen.TrekWindowLayout.INSTANCE.current(getActivity())));
    }
}
