package com.liketrek.trek.share

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.net.Uri
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.liketrek.trek.MainActivity
import com.liketrek.trek.widget.WidgetArt
import com.liketrek.trek.widget.WidgetSnapshot
import com.liketrek.trek.widget.WidgetStore

/**
 * The trips as shortcuts: a long press on TREK's icon lists the coming ones and
 * opens a trip straight away, and the system share sheet offers them as direct
 * share targets, so a booking goes into its trip in one tap (ShareActivity
 * reads the shortcut's id). Rebuilt whenever the app writes its trip list.
 */
object TrekShortcuts {
    /** The category res/xml/shortcuts.xml's share-target names. */
    const val SHARE_CATEGORY = "com.liketrek.trek.category.TRIP_SHARE"
    private const val MAX = 4

    fun publish(context: Context) {
        val trips = ShareHandoff.trips(context).take(MAX)
        val limit = ShortcutManagerCompat.getMaxShortcutCountPerActivity(context).coerceAtLeast(1)
        val shortcuts = trips.take(limit).mapIndexed { rank, trip ->
            val open = Intent(Intent.ACTION_VIEW, Uri.parse(WidgetSnapshot.link("/trips/${trip.id}")), context, MainActivity::class.java)
            ShortcutInfoCompat.Builder(context, "trip.${trip.id}")
                .setShortLabel(trip.title.take(24))
                .setLongLabel(trip.title)
                .setIcon(IconCompat.createWithAdaptiveBitmap(icon(trip)))
                .setIntent(open)
                .setCategories(setOf(SHARE_CATEGORY))
                .setLongLived(true)
                .setRank(rank)
                .build()
        }
        runCatching {
            // Trips no longer listed lose their shortcut; pinned ones stay but are disabled by the system.
            val keep = shortcuts.map { it.id }.toSet()
            val stale = ShortcutManagerCompat.getDynamicShortcuts(context).map { it.id }.filter { it !in keep }
            if (stale.isNotEmpty()) ShortcutManagerCompat.removeLongLivedShortcuts(context, stale)
            ShortcutManagerCompat.setDynamicShortcuts(context, shortcuts)
        }
    }

    /** The trip's cover, else its own sky, cropped for an adaptive icon (108dp with a 72dp safe zone). */
    private fun icon(trip: ShareHandoff.Trip): Bitmap {
        val size = 216
        val source = WidgetArt.cover(trip.cover, 432) ?: WidgetArt.sky(trip.title, size, size)
        val out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val side = minOf(source.width, source.height)
        val from = Rect((source.width - side) / 2, (source.height - side) / 2, (source.width + side) / 2, (source.height + side) / 2)
        Canvas(out).drawBitmap(source, from, Rect(0, 0, size, size), Paint(Paint.FILTER_BITMAP_FLAG))
        return out
    }

    /** Whether there is anything to publish: the app wrote a trip list. */
    fun hasTrips(context: Context): Boolean = WidgetStore.trips(context).isNotEmpty()
}
