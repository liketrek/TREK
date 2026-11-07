package com.liketrek.trek.share

import android.content.Context
import com.liketrek.trek.widget.WidgetSnapshot
import com.liketrek.trek.widget.WidgetStore
import java.io.File
import java.time.LocalDate
import org.json.JSONObject

/**
 * The trips the share sheet offers, and the hand-over of the shared item to the
 * app. The trip list is the one the app keeps for the widgets (WidgetStore, key
 * "trips"); the item waits in the app's cache until MainActivity hands it to the
 * UI (TrekSharedFiles.receiveHandoff), the way ShareHandoff.swift does through
 * the keychain on iOS.
 */
object ShareHandoff {
    data class Trip(
        val id: Long,
        val title: String,
        val start: LocalDate?,
        val end: LocalDate?,
        val place: String?,
        /** The small cover from the trip's widget snapshot, base64, when the app wrote one. */
        val cover: String?,
    )

    /** The trips that have not ended yet, soonest first, then the six most recent past ones. */
    fun trips(context: Context, today: LocalDate = LocalDate.now()): List<Trip> {
        val all = WidgetStore.trips(context).map { ref ->
            val snapshot = WidgetStore.read(context, "trip.${ref.id}")?.let(WidgetSnapshot::parse)
            Trip(ref.id, ref.title, WidgetSnapshot.day(ref.start), WidgetSnapshot.day(ref.end), snapshot?.trip?.place, snapshot?.trip?.cover)
        }
        return order(all, today)
    }

    internal fun order(all: List<Trip>, today: LocalDate): List<Trip> {
        val ahead = all.filter { (it.end ?: LocalDate.MAX) >= today }.sortedBy { it.start ?: LocalDate.MAX }
        val past = all.filter { (it.end ?: LocalDate.MAX) < today }.sortedByDescending { it.end ?: LocalDate.MIN }
        return ahead + past.take(6)
    }

    private fun dir(context: Context) = File(context.cacheDir, "share").apply { mkdirs() }

    /** Leaves the item for the app, with the trip it goes to (null: the app asks). */
    fun store(context: Context, item: ShareItem, tripId: Long?): Boolean = runCatching {
        val meta = JSONObject().put("name", item.name).put("mimeType", item.mimeType)
        if (tripId != null) meta.put("tripId", tripId)
        File(dir(context), "pending.data").writeBytes(item.data)
        File(dir(context), "pending.json").writeText(meta.toString())
        true
    }.getOrDefault(false)

    /** The item left by [store], taken once. */
    fun take(context: Context): Pair<JSONObject, ByteArray>? {
        val metaFile = File(dir(context), "pending.json")
        val dataFile = File(dir(context), "pending.data")
        if (!metaFile.exists() || !dataFile.exists()) return null
        return try {
            JSONObject(metaFile.readText()) to dataFile.readBytes()
        } catch (e: Exception) {
            null
        } finally {
            metaFile.delete()
            dataFile.delete()
        }
    }
}
