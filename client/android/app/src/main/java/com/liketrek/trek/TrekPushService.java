package com.liketrek.trek;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Base64;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/**
 * Receives the relay's data messages ({enc}: the server's encrypted Web Push
 * record), decrypts them with the device's keys and shows the notification.
 * Without the keys, or when the record does not open, it shows the same
 * neutral text the iOS extension falls back to, never the ciphertext.
 */
public class TrekPushService extends FirebaseMessagingService {

    static final String CHANNEL = "trek";
    static final String EXTRA_URL = "trek.pushUrl";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        String enc = message.getData().get("enc");
        if (enc == null) return;
        String title = getString(R.string.push_fallback_title);
        String body = getString(R.string.push_fallback_body);
        String url = null;
        String tag = null;
        try {
            TrekPushKeys keys = TrekPushKeys.load(this);
            if (keys != null) {
                byte[] plain = TrekWebPush.decrypt(Base64.decode(enc, Base64.DEFAULT), keys);
                JSONObject payload = new JSONObject(new String(plain, StandardCharsets.UTF_8));
                if (!payload.optString("title").isEmpty()) title = payload.optString("title");
                body = payload.optString("body", body);
                url = payload.optString("url", null);
                tag = payload.optString("tag", null);
            }
        } catch (Exception unreadable) {
            // Shown with the neutral text: the tap still opens the app.
        }
        show(this, title, body, url, tag);
    }

    /** A new token means a new endpoint; the UI re-registers on its next start (resyncPushSubscription). */
    @Override
    public void onNewToken(@NonNull String token) {}

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL,
            context.getString(R.string.push_channel_name),
            NotificationManager.IMPORTANCE_DEFAULT
        );
        manager.createNotificationChannel(channel);
    }

    private static void show(Context context, String title, String body, String url, String tag) {
        ensureChannel(context);
        Intent open = new Intent(context, MainActivity.class)
            .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (url != null) open.putExtra(EXTRA_URL, url);
        int id = tag != null ? tag.hashCode() : (int) (System.currentTimeMillis() & 0x7fffffff);
        PendingIntent tap = PendingIntent.getActivity(
            context,
            id,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_trek)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(tap);
        if (Build.VERSION.SDK_INT >= 33
            && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        try {
            NotificationManagerCompat.from(context).notify(tag, id, builder.build());
        } catch (SecurityException notAllowed) {
            // Notifications switched off for the app since it subscribed.
        }
    }
}
