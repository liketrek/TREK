package com.liketrek.trek.screen

import android.app.Activity
import android.graphics.Rect
import androidx.activity.ComponentActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import androidx.window.layout.WindowMetricsCalculator
import com.getcapacitor.JSObject
import kotlinx.coroutines.launch

/**
 * The window's shape for the UI (TrekShell.getWindowLayout and the
 * "windowLayout" event, feature windowLayout): its size class by Android's
 * breakpoints, and a foldable's posture and hinge through Jetpack WindowManager.
 *
 * The layouts themselves follow the CSS size classes (hooks/sizeClass.ts), which
 * the WebView answers from the window like any browser; this adds what CSS cannot
 * see: that a Galaxy Z Fold or Pixel Fold is half open like a laptop or a book,
 * and where the hinge runs, so a layout can keep content off the fold. Lengths
 * are in CSS pixels, relative to the window.
 */
object TrekWindowLayout {
    @Volatile var latest: JSObject = JSObject()
        private set

    fun observe(activity: ComponentActivity, emit: (JSObject) -> Unit) {
        latest = describe(activity, null)
        activity.lifecycleScope.launch {
            activity.repeatOnLifecycle(Lifecycle.State.STARTED) {
                WindowInfoTracker.getOrCreate(activity).windowLayoutInfo(activity).collect { info ->
                    latest = describe(activity, info)
                    emit(latest)
                }
            }
        }
    }

    fun describe(activity: Activity, info: WindowLayoutInfo?): JSObject {
        val density = activity.resources.displayMetrics.density
        val bounds = WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(activity).bounds
        val widthDp = bounds.width() / density
        val heightDp = bounds.height() / density
        val result = JSObject()
            .put("width", widthDp.toInt())
            .put("height", heightDp.toInt())
            .put("widthClass", sizeClass(widthDp, 600f, 840f))
            .put("heightClass", sizeClass(heightDp, 480f, 900f))
        val fold = info?.displayFeatures?.filterIsInstance<FoldingFeature>()?.firstOrNull()
        if (fold == null) {
            result.put("posture", "none")
        } else {
            val r: Rect = fold.bounds
            result.put("posture", if (fold.state == FoldingFeature.State.HALF_OPENED) "halfOpened" else "flat")
                .put("orientation", if (fold.orientation == FoldingFeature.Orientation.VERTICAL) "vertical" else "horizontal")
                .put("separating", fold.isSeparating)
                .put("occluding", fold.occlusionType == FoldingFeature.OcclusionType.FULL)
                .put(
                    "hinge",
                    JSObject()
                        .put("left", ((r.left - bounds.left) / density).toInt())
                        .put("top", ((r.top - bounds.top) / density).toInt())
                        .put("right", ((r.right - bounds.left) / density).toInt())
                        .put("bottom", ((r.bottom - bounds.top) / density).toInt()),
                )
        }
        return result
    }

    /** Android's window size classes: compact, medium, expanded. */
    fun sizeClass(dp: Float, medium: Float, expanded: Float): String = when {
        dp < medium -> "compact"
        dp < expanded -> "medium"
        else -> "expanded"
    }
}
