package com.liketrek.trek;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.CapConfig;
import com.getcapacitor.Logger;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import org.json.JSONException;
import org.json.JSONObject;

/** The server the user picked, and the Capacitor configuration that loads it. */
final class TrekServerStore {

    private static final String PREFS = "trek_shell";
    private static final String KEY_URL = "server_url";
    private static final String KEY_PREVIOUS_URL = "previous_server_url";
    private static final String KEY_SERVER_CHECK = "server_check";
    private static final String KEY_LABEL_SIGN_IN_HINT = "label_sign_in_hint";
    private static final String KEY_LABEL_CHANGE_SERVER = "label_change_server";
    private static final String KEY_LABEL_ERROR_PAGE_HINT = "label_error_page_hint";

    /**
     * The server API this build needs (MIN_NATIVE_API in serverAddress.ts). A
     * server remembered under a lower value is checked once more: the first
     * launch after an update that raised it puts the address screen back up,
     * filled in with that server (getPreviousUrl). Raise both together.
     */
    private static final int SERVER_CHECK = 3;
    private static final String KEY_SIGN_IN_HOSTS = "sign_in_hosts";
    private static final String KEY_SHELL_ONCE = "shell_once";
    private static final String KEY_RESTART = "restart";
    private static final String KEY_OFFLINE_START = "offline_start";
    private static final String KEY_WELCOME = "welcome";
    private static final String CONFIG_DIR = "trek-server-config";

    private TrekServerStore() {}

    /**
     * The one-time code of a TREK Cloud purchase (setServer's `welcome`). The
     * server's first page opens its welcome page with it once, which signs the
     * buyer in (TrekWebViewClient). Kept only until the restart has loaded.
     */
    static void setWelcome(Context context, String code) {
        SharedPreferences.Editor editor = prefs(context).edit();
        if (code == null) editor.remove(KEY_WELCOME);
        else editor.putString(KEY_WELCOME, code);
        editor.commit();
    }

    /** The welcome page for the pending code, handed out once; null when there is none. */
    static String takeWelcomeUrl(Context context) {
        String code = prefs(context).getString(KEY_WELCOME, null);
        String server = getUrl(context);
        if (code == null) return null;
        prefs(context).edit().remove(KEY_WELCOME).commit();
        if (server == null) return null;
        return (server.endsWith("/") ? server : server + "/") + "api/managed/welcome#" + code;
    }

    static String getUrl(Context context) {
        return prefs(context).getString(KEY_URL, null);
    }

    /** Runs before the bridge is built, so a server picked under an older minimum is not loaded unchecked. */
    static void recheckAfterUpdate(Context context) {
        SharedPreferences prefs = prefs(context);
        if (prefs.getInt(KEY_SERVER_CHECK, 0) >= SERVER_CHECK) return;
        String server = getUrl(context);
        SharedPreferences.Editor editor = prefs.edit().putInt(KEY_SERVER_CHECK, SERVER_CHECK);
        if (server != null) editor.remove(KEY_URL).remove(KEY_SIGN_IN_HOSTS).putString(KEY_PREVIOUS_URL, server);
        editor.commit();
    }

    /**
     * The words of the bar over a proxy's sign-in page, in the user's language,
     * as the address screen passed them (setServer's `labels`): the server's UI
     * is not there to say them. Null keeps the English fallback.
     */
    static void setLabels(Context context, String signInHint, String changeServer, String errorPageHint) {
        SharedPreferences.Editor editor = prefs(context).edit();
        if (signInHint != null) editor.putString(KEY_LABEL_SIGN_IN_HINT, signInHint);
        if (changeServer != null) editor.putString(KEY_LABEL_CHANGE_SERVER, changeServer);
        if (errorPageHint != null) editor.putString(KEY_LABEL_ERROR_PAGE_HINT, errorPageHint);
        editor.commit();
    }

    static String errorPageHintLabel(Context context) {
        return prefs(context).getString(
            KEY_LABEL_ERROR_PAGE_HINT,
            "This page is not from TREK: the server or a proxy in front of it refused the app. Check your proxy or certificate, or change the server."
        );
    }

    static String signInHintLabel(Context context) {
        return prefs(context).getString(
            KEY_LABEL_SIGN_IN_HINT,
            "Passkeys and security keys do not work on this page in the app. Sign in with a password, or let the app through your proxy."
        );
    }

    static String changeServerLabel(Context context) {
        return prefs(context).getString(KEY_LABEL_CHANGE_SERVER, "Change server");
    }

    /** The server an update asked to check again, until a server is set. */
    static String getPreviousUrl(Context context) {
        return prefs(context).getString(KEY_PREVIOUS_URL, null);
    }

    /** Remembers the server; its sign-in hosts go with it and are replaced or dropped too. */
    static void setUrl(Context context, String url) {
        setServer(context, url, null);
    }

    static void setServer(Context context, String url, Set<String> signInHosts) {
        SharedPreferences.Editor editor = prefs(context).edit();
        if (url == null) {
            editor.remove(KEY_URL);
        } else {
            editor.putString(KEY_URL, url).remove(KEY_PREVIOUS_URL);
        }
        if (signInHosts == null || signInHosts.isEmpty()) {
            editor.remove(KEY_SIGN_IN_HOSTS);
        } else {
            Set<String> lower = new HashSet<>();
            for (String host : signInHosts) lower.add(host.toLowerCase(Locale.ROOT));
            editor.putStringSet(KEY_SIGN_IN_HOSTS, lower);
        }
        editor.commit();
    }

    /**
     * The hosts of a sign-in page that stands in front of the server (a proxy
     * such as Cloudflare Access or Pangolin), as the address screen found them.
     * Only these may load inside the web view besides the server itself, so
     * the proxy's session lands where the app can use it (TrekWebViewClient).
     */
    static Set<String> getSignInHosts(Context context) {
        Set<String> hosts = prefs(context).getStringSet(KEY_SIGN_IN_HOSTS, null);
        return hosts == null ? Collections.emptySet() : Collections.unmodifiableSet(new HashSet<>(hosts));
    }

    /** Keeps one more sign-in host for the remembered server, as the web view met it (SignInRedirect). */
    static void addSignInHost(Context context, String host) {
        Set<String> hosts = new HashSet<>(getSignInHosts(context));
        if (!hosts.add(host.toLowerCase(Locale.ROOT))) return;
        prefs(context).edit().putStringSet(KEY_SIGN_IN_HOSTS, hosts).commit();
    }

    /** Start the next launch on the bundled address screen, even with a server remembered. */
    private static final String KEY_FAILURE = "last_failure";

    /**
     * Why the server's page did not load, in the WebView's own terms
     * ("net::ERR_NAME_NOT_RESOLVED (-2)", "HTTP 503"): the address screen shows
     * it small under its message, so a report carries the cause.
     */
    static void setFailure(Context context, String failure) {
        prefs(context).edit().putString(KEY_FAILURE, failure).commit();
    }

    /** The failure behind this address screen, once. */
    static String takeFailure(Context context) {
        String failure = prefs(context).getString(KEY_FAILURE, null);
        if (failure != null) prefs(context).edit().remove(KEY_FAILURE).commit();
        return failure;
    }

    static void showShellOnce(Context context) {
        prefs(context).edit().putBoolean(KEY_SHELL_ONCE, true).commit();
    }

    static boolean consumeShellOnce(Context context) {
        return consume(context, KEY_SHELL_ONCE);
    }

    /** The next onCreate is the app restarting itself, not a launch. */
    static void markRestart(Context context) {
        prefs(context).edit().putBoolean(KEY_RESTART, true).commit();
    }

    static boolean consumeRestart(Context context) {
        return consume(context, KEY_RESTART);
    }

    /** The next onCreate starts on the stored copy of the server's UI (TrekOfflineShell). */
    static void markOfflineStart(Context context) {
        prefs(context).edit().putBoolean(KEY_OFFLINE_START, true).commit();
    }

    static boolean consumeOfflineStart(Context context) {
        return consume(context, KEY_OFFLINE_START);
    }

    /**
     * The remembered server, or the one an update asked to check again: the
     * server the stored copy of the UI belongs to.
     */
    static String getUrlOrPrevious(Context context) {
        String url = getUrl(context);
        return url != null ? url : getPreviousUrl(context);
    }

    /**
     * Starting on the stored copy while the check an update asked for could not
     * run: the server goes back in place, unchecked for now, and the check runs
     * again on the next launch, which reaches the server.
     */
    static void restoreForOffline(Context context) {
        SharedPreferences prefs = prefs(context);
        if (prefs.getString(KEY_URL, null) != null) return;
        String previous = prefs.getString(KEY_PREVIOUS_URL, null);
        if (previous == null) return;
        prefs.edit().putString(KEY_URL, previous).remove(KEY_PREVIOUS_URL).putInt(KEY_SERVER_CHECK, 0).commit();
    }

    private static boolean consume(Context context, String key) {
        boolean set = prefs(context).getBoolean(key, false);
        if (set) prefs(context).edit().remove(key).commit();
        return set;
    }

    /**
     * The bundled capacitor.config.json, adjusted for this start. Capacitor only
     * takes these settings from a config file, so this writes a copy into the
     * app's private storage and loads that; null means the bundled one as it is.
     *
     * With a server: server.url set, and server.errorPath dropped, because that
     * page would have no bridge on the server's origin (TrekWebViewClient
     * handles a failed load instead).
     *
     * On a restart: no launch splash. The splash plugin shows it again after
     * recreate() but cannot take it down when the page hides it early, which
     * left it covering a fully rendered page. A restart has no launch to cover.
     */
    static CapConfig configFor(Context context, String url, boolean restarting) {
        if (url == null && !restarting) return null;
        try {
            JSONObject json = new JSONObject(readAsset(context, "capacitor.config.json"));
            if (url != null) {
                JSONObject server = child(json, "server");
                server.put("url", url);
                server.remove("errorPath");
            }
            if (restarting) {
                child(child(json, "plugins"), "SplashScreen").put("launchShowDuration", 0);
            }

            File dir = new File(context.getFilesDir(), CONFIG_DIR);
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Cannot create " + dir);
            try (FileOutputStream out = new FileOutputStream(new File(dir, "capacitor.config.json"))) {
                out.write(json.toString().getBytes(StandardCharsets.UTF_8));
            }
            return CapConfig.loadFromFile(context, dir.getAbsolutePath());
        } catch (IOException | JSONException ex) {
            Logger.error("TrekShell", "Could not adjust the app config for " + url, ex);
            return null;
        }
    }

    private static JSONObject child(JSONObject parent, String key) throws JSONException {
        JSONObject existing = parent.optJSONObject(key);
        if (existing != null) return existing;
        JSONObject created = new JSONObject();
        parent.put(key, created);
        return created;
    }

    private static String readAsset(Context context, String name) throws IOException {
        try (InputStream in = context.getAssets().open(name); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
            return out.toString("UTF-8");
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
