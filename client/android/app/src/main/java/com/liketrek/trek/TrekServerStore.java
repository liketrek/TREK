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

    /**
     * The bundled capacitor.config.json with server.url set. Capacitor only
     * takes the server URL from a config file, so this writes a copy into the
     * app's private storage and loads that. Falls back to the bundled config,
     * which shows the address screen, if the copy cannot be written.
     */
    static CapConfig configFor(Context context, String url) {
        try {
            JSONObject json = new JSONObject(readAsset(context, "capacitor.config.json"));
            JSONObject server = json.optJSONObject("server");
            if (server == null) {
                server = new JSONObject();
                json.put("server", server);
            }
            server.put("url", url);

            File dir = new File(context.getFilesDir(), CONFIG_DIR);
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Cannot create " + dir);
            try (FileOutputStream out = new FileOutputStream(new File(dir, "capacitor.config.json"))) {
                out.write(json.toString().getBytes(StandardCharsets.UTF_8));
            }
            return CapConfig.loadFromFile(context, dir.getAbsolutePath());
        } catch (IOException | JSONException ex) {
            Logger.error("TrekShell", "Could not point the app at " + url, ex);
            return CapConfig.loadDefault(context);
        }
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
