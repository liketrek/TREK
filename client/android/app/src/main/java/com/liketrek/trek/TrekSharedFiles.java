package com.liketrek.trek;

import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Booking documents shared to TREK (open with / share), held until the UI takes
 * them (TrekShell.takeSharedFile) and announced if it is already running.
 */
final class TrekSharedFiles {
    /** Above this the file is not a booking confirmation. */
    private static final int MAX_BYTES = 15 * 1024 * 1024;

    interface Listener {
        void onFile(JSObject file);
    }

    private static JSObject pending;
    private static Listener listener;

    private TrekSharedFiles() {}

    static void setListener(Listener l) {
        listener = l;
    }

    static JSObject take() {
        JSObject file = pending;
        pending = null;
        return file;
    }

    static void receive(Context context, Intent intent) {
        if (intent == null) return;
        if (MainActivity.ACTION_SHARE_HANDOFF.equals(intent.getAction())) {
            receiveHandoff(context);
            return;
        }
        Uri uri = null;
        // A view intent also brings sign-in callbacks and widget links; only a file is a document.
        if (Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null
            && ("content".equals(intent.getData().getScheme()) || "file".equals(intent.getData().getScheme()))) {
            uri = intent.getData();
        }
        else if (Intent.ACTION_SEND.equals(intent.getAction())) uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri == null) return;
        try (InputStream in = context.getContentResolver().openInputStream(uri)) {
            if (in == null) return;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[16384];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
                if (out.size() > MAX_BYTES) return;
            }
            JSObject file = new JSObject();
            file.put("name", displayName(context, uri));
            String type = context.getContentResolver().getType(uri);
            file.put("mimeType", type == null ? intent.getType() : type);
            file.put("data", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            pending = file;
            if (listener != null) listener.onFile(file);
        } catch (Exception ignored) {
            // Unreadable or gone: nothing to import.
        }
    }

    /** The item the share sheet left (share/ShareHandoff.kt), with the trip picked for it there. */
    static void receiveHandoff(Context context) {
        kotlin.Pair<org.json.JSONObject, byte[]> item = com.liketrek.trek.share.ShareHandoff.INSTANCE.take(context);
        if (item == null || item.getSecond().length > MAX_BYTES) return;
        org.json.JSONObject meta = item.getFirst();
        JSObject file = new JSObject();
        file.put("name", meta.optString("name", "booking"));
        file.put("mimeType", meta.optString("mimeType", "application/octet-stream"));
        file.put("data", Base64.encodeToString(item.getSecond(), Base64.NO_WRAP));
        if (meta.has("tripId")) file.put("tripId", meta.optLong("tripId"));
        pending = file;
        if (listener != null) listener.onFile(file);
    }

    private static String displayName(Context context, Uri uri) {
        try (Cursor cursor = context.getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) return cursor.getString(0);
        } catch (Exception ignored) {
            // Fall through to the path.
        }
        String last = uri.getLastPathSegment();
        return last == null ? "booking" : last;
    }
}
