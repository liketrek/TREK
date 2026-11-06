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
        Uri uri = null;
        if (Intent.ACTION_VIEW.equals(intent.getAction())) uri = intent.getData();
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
