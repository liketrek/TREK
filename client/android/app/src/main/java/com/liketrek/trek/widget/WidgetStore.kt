package com.liketrek.trek.widget

import android.content.Context
import java.io.File

/**
 * Where the widgets' snapshots live: one JSON file per key in the app's own
 * storage. The widgets run in the app's process, so no shared container is
 * needed as on iOS; the keys are the same ones the UI writes there
 * ("snapshot", "trips", "trip.<id>").
 */
object WidgetStore {
    private val KEY = Regex("^(snapshot|trips|trip\\.[0-9]{1,12})$")
    private const val PREFS = "trek.widgets"
    const val AUTO = "auto"

    fun isValidKey(key: String): Boolean = KEY.matches(key)

    private fun dir(context: Context): File = File(context.filesDir, "widgets").apply { mkdirs() }

    fun write(context: Context, key: String, json: String) {
        require(isValidKey(key)) { "key must be snapshot, trips or trip.<id>" }
        val target = File(dir(context), "$key.json")
        val temp = File(dir(context), "$key.json.tmp")
        temp.writeText(json)
        if (!temp.renameTo(target)) {
            target.delete()
            temp.renameTo(target)
        }
    }

    fun read(context: Context, key: String): String? {
        if (!isValidKey(key)) return null
        val file = File(dir(context), "$key.json")
        return if (file.exists()) runCatching { file.readText() }.getOrNull() else null
    }

    /** The dashboard's snapshot. */
    fun load(context: Context): WidgetSnapshot? = read(context, "snapshot")?.let(WidgetSnapshot::parse)

    /**
     * The snapshot of the trip a widget is set to; the dashboard's for none or
     * "auto", and the dashboard's too while the app has not written that trip.
     * A trip's snapshot carries no Atlas, so it borrows the dashboard's.
     */
    fun load(context: Context, tripId: String?): WidgetSnapshot? {
        if (tripId == null || tripId == AUTO) return load(context)
        val own = read(context, "trip.$tripId")?.let(WidgetSnapshot::parse) ?: return load(context)
        return if (own.atlas == null) own.copy(atlas = load(context)?.atlas) else own
    }

    fun trips(context: Context): List<TripRef> = TripRef.parseList(read(context, "trips"))

    /** The trip picked for one placed widget, "auto" when none was. */
    fun tripFor(context: Context, appWidgetId: Int): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("trip.$appWidgetId", AUTO) ?: AUTO

    fun setTripFor(context: Context, appWidgetId: Int, tripId: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("trip.$appWidgetId", tripId).apply()
    }

    fun forget(context: Context, appWidgetIds: IntArray) {
        val editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        for (id in appWidgetIds) editor.remove("trip.$id")
        editor.apply()
    }
}
