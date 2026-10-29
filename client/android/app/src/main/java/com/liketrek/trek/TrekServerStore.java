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
import org.json.JSONException;
import org.json.JSONObject;

/** The server the user picked, and the Capacitor configuration that loads it. */
final class TrekServerStore {

    private static final String PREFS = "trek_shell";
    private static final String KEY_URL = "server_url";
    private static final String KEY_SHELL_ONCE = "shell_once";
    private static final String KEY_RESTART = "restart";
    private static final String CONFIG_DIR = "trek-server-config";

    private TrekServerStore() {}

    static String getUrl(Context context) {
        return prefs(context).getString(KEY_URL, null);
    }

    static void setUrl(Context context, String url) {
        SharedPreferences.Editor editor = prefs(context).edit();
        if (url == null) {
            editor.remove(KEY_URL);
        } else {
            editor.putString(KEY_URL, url);
        }
        editor.commit();
    }

    /** Start the next launch on the bundled address screen, even with a server remembered. */
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
