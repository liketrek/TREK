package com.liketrek.trek.tripday

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.IconCompat
import com.liketrek.trek.MainActivity
import com.liketrek.trek.R
import com.liketrek.trek.widget.TrekIcons
import com.liketrek.trek.widget.WidgetSnapshot
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

/**
 * The travel day as a Live Update, the Android counterpart of the iOS Live
 * Activity (TripDayLiveActivity.swift): an ongoing notification with the next
 * stop, its time as the status-bar chip and a countdown, and the day's stops as
 * a segmented progress bar. Android 16 promotes it to the top of the shade and
 * the lock screen (ProgressStyle, POST_PROMOTED_NOTIFICATIONS); older versions
 * show the same content as a quiet ongoing notification with a plain bar.
 *
 * The UI starts, updates and ends it (TrekShell.syncTripDay / endTripDay), and
 * it lapses on its own at midnight, so a forgotten one never lingers.
 */
object TripDayNotification {
    const val CHANNEL = "tripday"
    private const val ID = 0x7d1

    data class State(
        val tripTitle: String,
        val path: String,
        val dayLabel: String,
        val nextName: String,
        val nextTime: String?,
        /** Minutes after midnight of the next stop, for the countdown. */
        val nextMinutes: Int?,
        val done: Int,
        val total: Int,
        /** #rrggbb of each stop, for the segments; may be empty. */
        val colors: List<String?> = emptyList(),
    )

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL) != null) return
        // Default importance: low would keep it out of the status bar chip and promotion.
        val channel = NotificationChannel(CHANNEL, context.getString(R.string.push_channel_tripday), NotificationManager.IMPORTANCE_DEFAULT).apply {
            description = context.getString(R.string.push_channel_tripday_description)
            setSound(null, null)
            enableVibration(false)
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    /** Whether it can be shown at all: notifications allowed, and the channel not switched off. */
    fun allowed(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return false
        }
        val manager = NotificationManagerCompat.from(context)
        if (!manager.areNotificationsEnabled()) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = context.getSystemService(NotificationManager::class.java)?.getNotificationChannel(CHANNEL)
            if (channel != null && channel.importance == NotificationManager.IMPORTANCE_NONE) return false
        }
        return true
    }

    /** Shows the day, or updates the one showing. False when notifications are off. */
    fun show(context: Context, state: State): Boolean {
        ensureChannel(context)
        if (!allowed(context)) return false
        try {
            NotificationManagerCompat.from(context).notify(ID, build(context, state))
        } catch (e: SecurityException) {
            return false
        }
        return true
    }

    fun end(context: Context) {
        NotificationManagerCompat.from(context).cancel(ID)
    }

    fun build(context: Context, state: State, today: LocalDate = LocalDate.now()): android.app.Notification {
        val open = Intent(Intent.ACTION_VIEW, Uri.parse(WidgetSnapshot.link(state.path)), context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val tap = PendingIntent.getActivity(context, ID, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val zone = ZoneId.systemDefault()
        val midnight = today.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
        val remaining = (midnight - System.currentTimeMillis()).coerceAtLeast(60_000L)

        val builder = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_trek)
            .setContentTitle(state.nextName)
            .setContentText(listOfNotNull(state.nextTime, state.tripTitle).joinToString("  "))
            .setSubText(state.dayLabel)
            .setContentIntent(tap)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setTimeoutAfter(remaining)
            .setRequestPromotedOngoing(true)

        state.nextTime?.let { builder.setShortCriticalText(it) }
        state.nextMinutes?.let { minutes ->
            val at = today.atTime(LocalTime.of((minutes / 60).coerceIn(0, 23), minutes % 60)).atZone(zone).toInstant().toEpochMilli()
            if (at > System.currentTimeMillis()) {
                builder.setWhen(at).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true)
            }
        }

        val total = state.total.coerceAtLeast(1)
        val done = state.done.coerceIn(0, total)
        val style = NotificationCompat.ProgressStyle()
            .setStyledByProgress(true)
            .setProgressTrackerIcon(IconCompat.createWithBitmap(TrekIcons.bitmap(TrekIcons.vector("figure.walk"), 72, ContextCompat.getColor(context, R.color.notification_accent))))
        for (i in 0 until total) {
            val color = state.colors.getOrNull(i)?.let(::parseColor) ?: ContextCompat.getColor(context, R.color.tripday_segment)
            style.addProgressSegment(NotificationCompat.ProgressStyle.Segment(1).setColor(color))
        }
        style.setProgress(done)
        builder.setStyle(style)
        // Before Android 16 the style falls back to nothing: the plain bar carries the progress.
        if (Build.VERSION.SDK_INT < 36) builder.setProgress(total, done, false)
        return builder.build()
    }

    private fun parseColor(css: String): Int? = runCatching { android.graphics.Color.parseColor(css) }.getOrNull()
}
