package com.liketrek.trek.widget

import android.content.Context
import android.os.Build
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.updateAll
import kotlin.reflect.KClass
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/** The widget providers the manifest lists, one per widget in the picker. */
abstract class TrekWidgetReceiver : GlanceAppWidgetReceiver() {
    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)
        WidgetStore.forget(context, appWidgetIds)
    }
}

class TripWidgetReceiver : TrekWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = TripWidget()
}

class TodayWidgetReceiver : TrekWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = TodayWidget()
}

class BookingsWidgetReceiver : TrekWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = BookingsWidget()
}

class TodosWidgetReceiver : TrekWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = TodosWidget()
}

class PackingWidgetReceiver : TrekWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = PackingWidget()
}

class AtlasWidgetReceiver : TrekWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = AtlasWidget()
}

class CollabWidgetReceiver : TrekWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = CollabWidget()
}

/** Redraws every placed TREK widget after the app wrote a new snapshot. */
object TrekWidgetUpdater {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val receivers: List<KClass<out GlanceAppWidgetReceiver>> = listOf(
        TripWidgetReceiver::class,
        TodayWidgetReceiver::class,
        BookingsWidgetReceiver::class,
        TodosWidgetReceiver::class,
        PackingWidgetReceiver::class,
        AtlasWidgetReceiver::class,
        CollabWidgetReceiver::class,
    )

    fun widgets(): List<GlanceAppWidget> =
        listOf(TripWidget(), TodayWidget(), BookingsWidget(), TodosWidget(), PackingWidget(), AtlasWidget(), CollabWidget())

    @JvmStatic
    fun refreshAll(context: Context) {
        val app = context.applicationContext
        scope.launch { for (widget in widgets()) runCatching { widget.updateAll(app) } }
    }

    /**
     * Android 15's widget picker shows a live preview drawn by the widget itself
     * (providePreview) instead of a static image. The system rate-limits the
     * call, so it runs once per app version.
     */
    @JvmStatic
    fun publishPreviews(context: Context) {
        if (Build.VERSION.SDK_INT < 35) return
        val app = context.applicationContext
        val prefs = app.getSharedPreferences("trek.widgets", Context.MODE_PRIVATE)
        val version = runCatching { app.packageManager.getPackageInfo(app.packageName, 0).lastUpdateTime }.getOrDefault(0L)
        if (prefs.getLong("previews", -1L) == version) return
        scope.launch {
            val manager = GlanceAppWidgetManager(app)
            val all = receivers.all { runCatching { manager.setWidgetPreviews(it); true }.getOrDefault(false) }
            if (all) prefs.edit().putLong("previews", version).apply()
        }
    }
}
