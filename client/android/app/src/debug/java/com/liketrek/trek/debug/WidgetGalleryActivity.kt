package com.liketrek.trek.debug

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.glance.appwidget.ExperimentalGlanceRemoteViewsApi
import androidx.glance.appwidget.GlanceRemoteViews
import com.liketrek.trek.tripday.TripDayNotification
import com.liketrek.trek.widget.AtlasWidget
import com.liketrek.trek.widget.BookingsWidget
import com.liketrek.trek.widget.CollabWidget
import com.liketrek.trek.widget.PackingWidget
import com.liketrek.trek.widget.TodayWidget
import com.liketrek.trek.widget.TodosWidget
import com.liketrek.trek.widget.TrekSizes
import com.liketrek.trek.widget.TrekWidget
import com.liketrek.trek.widget.TrekWidgetTheme
import com.liketrek.trek.widget.TripWidget
import com.liketrek.trek.widget.WidgetSamples
import com.liketrek.trek.widget.WidgetStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Debug builds only: every widget at every size, drawn by the real Glance code
 * into real RemoteViews, so they can be looked at and screenshot without placing
 * each on a home screen.
 *
 *   adb shell am start -n com.liketrek.trek/.debug.WidgetGalleryActivity --es widget trip --ez running true --ez dark false
 *
 * --es seed sample also writes the sample trip as the app's snapshot, so the
 * placed widgets, the share sheet and the shortcuts have a trip to show; and
 * --ez tripday true posts the travel day's Live Update from the sample.
 */
@OptIn(ExperimentalGlanceRemoteViewsApi::class)
class WidgetGalleryActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val running = intent.getBooleanExtra("running", true)
        val dark = intent.getBooleanExtra("dark", false)
        val only = intent.getStringExtra("widget")
        if (intent.getStringExtra("seed") == "sample") seed()
        if (intent.getBooleanExtra("tripday", false)) {
            TripDayNotification.show(
                this,
                TripDayNotification.State(
                    "Autumn in Kyoto", "/trips/1", "Day 3 of 9", "Kiyomizu-dera", "13:30", 810, 2, 5,
                    listOf("#D6273B", "#E8A13A", "#2FA37A", "#4A7DDB", "#8E6CD9"),
                ),
            )
        }

        val config = Configuration(resources.configuration).apply {
            uiMode = (uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or if (dark) Configuration.UI_MODE_NIGHT_YES else Configuration.UI_MODE_NIGHT_NO
        }
        val themed = createConfigurationContext(config)
        val list = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(px(16), px(if (intent.getBooleanExtra("bare", false)) 96 else 32), px(16), px(32))
            val bg = intent.getStringExtra("bg")
            setBackgroundColor(if (bg != null) Color.parseColor("#$bg") else if (dark) Color.rgb(28, 27, 31) else Color.rgb(222, 226, 236))
        }
        setContentView(ScrollView(this).apply { addView(list) })

        val widgets: List<Pair<String, TrekWidget>> = listOf(
            "trip" to TripWidget(),
            "today" to TodayWidget(),
            "bookings" to BookingsWidget(),
            "todos" to TodosWidget(),
            "packing" to PackingWidget(),
            "atlas" to AtlasWidget(),
            "collab" to CollabWidget(),
        ).filter { only == null || it.first == only }
        // --ez store true draws what the app really wrote, instead of the sample trip.
        val snapshot = if (intent.getBooleanExtra("store", false)) WidgetStore.load(this) else WidgetSamples.snapshot(running)
        CoroutineScope(Dispatchers.Main).launch {
            for ((name, widget) in widgets) {
                if (!intent.getBooleanExtra("bare", false)) list.addView(TextView(this@WidgetGalleryActivity).apply {
                    text = name
                    setTextColor(if (dark) Color.WHITE else Color.DKGRAY)
                    setPadding(0, px(12), 0, px(6))
                })
                val onlySize = intent.getStringExtra("size")
                val sizes = listOf("small" to TrekSizes.SMALL, "wide" to TrekSizes.WIDE, "large" to TrekSizes.LARGE)
                for ((sizeName, size) in sizes) {
                    if (onlySize != null && onlySize != sizeName) continue
                    val result = GlanceRemoteViews().compose(themed, size) {
                        TrekWidgetTheme.Themed { widget.Content(snapshot) }
                    }
                    val host = FrameLayout(this@WidgetGalleryActivity)
                    host.addView(result.remoteViews.apply(themed, host), FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
                    list.addView(host, LinearLayout.LayoutParams(px(size.width.value), px(size.height.value)).apply { bottomMargin = px(12) })
                }
            }
        }
    }

    private fun seed() {
        WidgetStore.write(this, "snapshot", WidgetSamples.json(running = true))
        WidgetStore.write(this, "trip.1", WidgetSamples.json(running = true))
        WidgetStore.write(this, "trip.2", WidgetSamples.json(running = false).replace("Autumn in Kyoto", "Lisbon long weekend"))
        WidgetStore.write(
            this,
            "trips",
            """[{"id":1,"title":"Autumn in Kyoto","start":"${java.time.LocalDate.now().minusDays(2)}","end":"${java.time.LocalDate.now().plusDays(6)}"},
               {"id":2,"title":"Lisbon long weekend","start":"${java.time.LocalDate.now().plusDays(12)}","end":"${java.time.LocalDate.now().plusDays(15)}"},
               {"id":3,"title":"Norway by train","start":"2026-06-02","end":"2026-06-12"}]""",
        )
        com.liketrek.trek.widget.TrekWidgetUpdater.refreshAll(this)
        com.liketrek.trek.share.TrekShortcuts.publish(this)
    }

    private fun px(dp: Float): Int = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics).toInt()

    private fun px(dp: Int): Int = px(dp.toFloat())

}
