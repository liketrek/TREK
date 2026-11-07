package com.liketrek.trek.widget

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import android.util.Base64
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * The pictures a widget shows that RemoteViews cannot draw: the trip's cover,
 * its own sky when it has none, and the world map's dots. Drawn once per
 * update into bitmaps, kept small (a widget's RemoteViews have a size budget).
 */
object WidgetArt {
    /** A stable number for a text (FNV-1a), the same as TrekStyle.swift's seed. */
    fun seed(text: String): Long {
        var hash = 1469598103934665603L
        for (byte in text.toByteArray(Charsets.UTF_8)) {
            hash = (hash xor (byte.toLong() and 0xff)) * 1099511628211L
        }
        return hash
    }

    /** The trip's two colours, from its title: the same trip always gets the same sky. */
    fun tripHues(title: String): Pair<Int, Int> {
        val base = (java.lang.Long.remainderUnsigned(seed(title), 360)).toFloat()
        val first = Color.HSVToColor(floatArrayOf(base, 0.62f, 0.78f))
        val second = Color.HSVToColor(floatArrayOf((base + 40f) % 360f, 0.7f, 0.42f))
        return first to second
    }

    /** The cover the app sent, base64 JPEG, decoded down to at most [maxSide] pixels. */
    fun cover(base64: String?, maxSide: Int = 720): Bitmap? {
        if (base64.isNullOrBlank()) return null
        return try {
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
            var sample = 1
            while (bounds.outWidth / (sample * 2) >= maxSide || bounds.outHeight / (sample * 2) >= maxSide) sample *= 2
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, BitmapFactory.Options().apply { inSampleSize = sample })
        } catch (e: IllegalArgumentException) {
            null
        }
    }

    /** A trip without a cover: its two colours as a sky, with contour lines over it. */
    fun sky(title: String, width: Int = 480, height: Int = 480): Bitmap {
        val (first, second) = tripHues(title)
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.shader = LinearGradient(0f, 0f, width.toFloat(), height.toFloat(), first, second, Shader.TileMode.CLAMP)
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
        paint.shader = RadialGradient(width * 0.85f, height * 0.05f, width * 0.6f, Color.argb(70, 255, 255, 255), Color.TRANSPARENT, Shader.TileMode.CLAMP)
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
        paint.shader = null
        drawContours(canvas, width, height, java.lang.Long.remainderUnsigned(seed(title), 997).toInt(), Color.argb(36, 255, 255, 255))
        return bitmap
    }

    /** Concentric wobbly rings, the topographic lines that stand for travel in TREK. */
    private fun drawContours(canvas: Canvas, width: Int, height: Int, seed: Int, color: Int) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 2f
            this.color = color
        }
        val cx = width * (0.25f + (seed % 50) / 100f)
        val cy = height * (0.35f + (seed % 30) / 100f)
        val maxR = min(width, height) * 1.1f
        val rings = 11
        for (ring in 1..rings) {
            val r = maxR * ring / rings
            val path = Path()
            val steps = 72
            for (i in 0..steps) {
                val a = 2 * PI * i / steps
                val wobble = 1 + 0.08 * sin(a * 3 + seed + ring) + 0.05 * cos(a * 5 + seed * 0.7)
                val x = cx + (r * wobble * cos(a)).toFloat()
                val y = cy + (r * wobble * sin(a) * 0.8).toFloat()
                if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
            }
            canvas.drawPath(path, paint)
        }
    }

    /**
     * The world map as dots, white so the widget tints it: [visited] true draws
     * only the countries in [codes], false only the others.
     */
    fun worldDots(codes: Set<String>, visited: Boolean, dot: Int = 8): Bitmap {
        val rows = WorldGrid.ROWS.size
        val bitmap = Bitmap.createBitmap(WorldGrid.COLUMNS * dot, rows * dot, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = Color.WHITE }
        val radius = dot * 0.36f
        for (row in 0 until rows) {
            for (column in 0 until WorldGrid.COLUMNS) {
                val code = WorldGrid.code(row, column) ?: continue
                if ((code in codes) != visited) continue
                canvas.drawCircle(column * dot + dot / 2f, row * dot + dot / 2f, radius, paint)
            }
        }
        return bitmap
    }

    /** A ring of [progress] (0..1), white on a faint track, for the countdown and the packing. */
    fun ring(progress: Float, sizePx: Int = 160, stroke: Float = 14f, track: Int = Color.argb(60, 255, 255, 255)): Bitmap {
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = stroke
            strokeCap = Paint.Cap.ROUND
        }
        val inset = stroke / 2 + 1
        val oval = android.graphics.RectF(inset, inset, sizePx - inset, sizePx - inset)
        paint.color = track
        canvas.drawArc(oval, 0f, 360f, false, paint)
        paint.color = Color.WHITE
        val sweep = 360f * progress.coerceIn(0f, 1f)
        if (sweep > 0) canvas.drawArc(oval, -90f, sweep, false, paint)
        return bitmap
    }

    /** A trip's days as segments, filled up to [index]: white, the widget tints it. Track at a third. */
    fun segments(index: Int, total: Int, width: Int = 600, height: Int = 10): Bitmap {
        val count = total.coerceIn(1, 31)
        val filled = if (total > 31) (index * 31f / total).toInt().coerceAtLeast(1) else index
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val gap = if (count > 14) 4f else 8f
        val w = (width - gap * (count - 1)) / count
        for (i in 0 until count) {
            paint.color = if (i < filled) Color.WHITE else Color.argb(85, 255, 255, 255)
            val left = i * (w + gap)
            canvas.drawRoundRect(android.graphics.RectF(left, 0f, left + w, height.toFloat()), height / 2f, height / 2f, paint)
        }
        return bitmap
    }
}
