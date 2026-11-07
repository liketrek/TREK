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
        String event = null;
        try {
            TrekPushKeys keys = TrekPushKeys.load(this);
            if (keys != null) {
                byte[] plain = TrekWebPush.decrypt(Base64.decode(enc, Base64.DEFAULT), keys);
                JSONObject payload = new JSONObject(new String(plain, StandardCharsets.UTF_8));
                if (!payload.optString("title").isEmpty()) title = payload.optString("title");
                body = payload.optString("body", body);
                url = payload.optString("url", null);
                tag = payload.optString("tag", null);
                event = payload.optString("event", null);
            }
        } catch (Exception unreadable) {
            // Shown with the neutral text: the tap still opens the app.
        }
        show(this, title, body, url, tag, event);
    }

    /** A new token means a new endpoint; the UI re-registers on its next start (resyncPushSubscription). */
    @Override
    public void onNewToken(@NonNull String token) {}

    /** The channels, so each kind can be silenced, raised or kept on its own in the system settings. */
    static final String CHANNEL_CHAT = "chat";
    static final String CHANNEL_TRIPS = "trips";
    static final String CHANNEL_INVITES = "invites";

    /**
     * The channel of a notification by the event the server names (PushPayload.event,
     * notification-events.ts). A server too old to send one lands in the general channel.
     */
    static String channelFor(String event) {
        if (event == null) return CHANNEL;
        switch (event) {
            case "collab_message":
                return CHANNEL_CHAT;
            case "booking_change":
            case "trip_reminder":
            case "todo_due":
            case "packing_tagged":
                return CHANNEL_TRIPS;
            case "trip_invite":
            case "vacay_invite":
            case "vacay_share":
            case "collection_invite":
            case "photos_shared":
                return CHANNEL_INVITES;
            default:
                return CHANNEL;
        }
    }

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        create(manager, CHANNEL_CHAT, context.getString(R.string.push_channel_chat), NotificationManager.IMPORTANCE_HIGH);
        create(manager, CHANNEL_TRIPS, context.getString(R.string.push_channel_trips), NotificationManager.IMPORTANCE_DEFAULT);
        create(manager, CHANNEL_INVITES, context.getString(R.string.push_channel_invites), NotificationManager.IMPORTANCE_DEFAULT);
        create(manager, CHANNEL, context.getString(R.string.push_channel_name), NotificationManager.IMPORTANCE_DEFAULT);
        com.liketrek.trek.tripday.TripDayNotification.INSTANCE.ensureChannel(context);
    }

    @androidx.annotation.RequiresApi(Build.VERSION_CODES.O)
    private static void create(NotificationManager manager, String id, String name, int importance) {
        NotificationChannel existing = manager.getNotificationChannel(id);
        if (existing != null) {
            // Only the name follows the app's language; what the user set stays theirs.
            if (!name.contentEquals(existing.getName())) {
                existing.setName(name);
                manager.createNotificationChannel(existing);
            }
            return;
        }
        manager.createNotificationChannel(new NotificationChannel(id, name, importance));
    }

    private static void show(Context context, String title, String body, String url, String tag, String event) {
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
        String channel = channelFor(event);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channel)
            .setSmallIcon(R.drawable.ic_stat_trek)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setColor(ContextCompat.getColor(context, R.color.notification_accent))
            .setCategory(CHANNEL_CHAT.equals(channel) ? NotificationCompat.CATEGORY_MESSAGE : NotificationCompat.CATEGORY_EVENT)
            // One stack per kind in the shade, rather than a loose pile.
            .setGroup("trek." + channel)
            .setContentIntent(tap);
        if (Build.VERSION.SDK_INT >= 33
            && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        try {
            NotificationManagerCompat.from(context).notify(tag, id, builder.build());
            // The stack's head: the system folds the group under it from two notifications on.
            NotificationCompat.Builder summary = new NotificationCompat.Builder(context, channel)
                .setSmallIcon(R.drawable.ic_stat_trek)
                .setColor(ContextCompat.getColor(context, R.color.notification_accent))
                .setGroup("trek." + channel)
                .setGroupSummary(true)
                .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)
                .setAutoCancel(true);
            NotificationManagerCompat.from(context).notify("trek.summary", channel.hashCode(), summary.build());
        } catch (SecurityException notAllowed) {
            // Notifications switched off for the app since it subscribed.
        }
    }
}
