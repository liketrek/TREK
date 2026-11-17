package com.liketrek.trek.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.text.format.DateFormat
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceComposable
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.material3.ColorProviders
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.liketrek.trek.MainActivity
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

/**
 * What every TREK widget shares: Material You's colours on Android 12 and later
 * (the wallpaper's), TREK's own before that, the system's corner radius, the
 * tap that opens a place in the app, and the small pieces (eyebrow, chip, icon
 * badge) the widgets are built from.
 */
object TrekWidgetTheme {
    /** TREK's palette (client/src/mobile/mobile.css) for systems without dynamic colour. */
    val fallback = ColorProviders(
        light = lightColorScheme(
            primary = Color(0xFF101013),
            onPrimary = Color(0xFFF5F5F7),
            primaryContainer = Color(0xFFE7E5DF),
            onPrimaryContainer = Color(0xFF101013),
            secondary = Color(0xFF4A7DDB),
            secondaryContainer = Color(0xFFE4EAF7),
            onSecondaryContainer = Color(0xFF1B2F57),
            tertiary = Color(0xFF2FA37A),
            surface = Color(0xFFF7F6F2),
            onSurface = Color(0xFF101013),
            onSurfaceVariant = Color(0xFF68686F),
            surfaceVariant = Color(0xFFECEAE4),
            outline = Color(0xFF9A9AA1),
            background = Color(0xFFF1EFEA),
            error = Color(0xFFD6273B),
        ),
        dark = darkColorScheme(
            primary = Color(0xFFF5F5F7),
            onPrimary = Color(0xFF101013),
            primaryContainer = Color(0xFF26262C),
            onPrimaryContainer = Color(0xFFF5F5F7),
            secondary = Color(0xFF8AAEF0),
            secondaryContainer = Color(0xFF233250),
            onSecondaryContainer = Color(0xFFDCE6FA),
            tertiary = Color(0xFF5CC79E),
            surface = Color(0xFF121216),
            onSurface = Color(0xFFF5F5F7),
            onSurfaceVariant = Color(0xFF9C9CA3),
            surfaceVariant = Color(0xFF1E1E24),
            outline = Color(0xFF6E6E76),
            background = Color(0xFF0C0C0F),
            error = Color(0xFFFF6B7A),
        ),
    )

    @Composable
    fun Themed(content: @Composable () -> Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) GlanceTheme(content = content) else GlanceTheme(colors = fallback, content = content)
    }
}

/** The status colours, the same on every wallpaper so they keep their meaning. */
object TrekStatus {
    val confirmed = ColorProvider(Color(0xFF2FA37A))
    val pending = ColorProvider(Color(0xFFE8A13A))
    val danger = ColorProvider(Color(0xFFD6273B))
    val white = ColorProvider(Color.White)
    val whiteMuted = ColorProvider(Color(0xCCFFFFFF))
    val whiteFaint = ColorProvider(Color(0x99FFFFFF))
    val scrim = ColorProvider(Color(0x66000000))
    val glass = ColorProvider(Color(0x33000000))
}

/** Opens [path] of the user's server in the app (nativeApp.ts routes com.liketrek.trek://navigate). */
fun openPath(context: Context, path: String): Action = actionStartActivity(
    Intent(Intent.ACTION_VIEW, Uri.parse(WidgetSnapshot.link(path)), context, MainActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
)

/** The ground of a widget: the system's widget shape and the theme's widget background. */
@Composable
fun WidgetFrame(
    onClick: Action?,
    background: ColorProvider = GlanceTheme.colors.widgetBackground,
    padding: Dp = 14.dp,
    content: @Composable () -> Unit,
) {
    var modifier = GlanceModifier.fillMaxSize().appWidgetBackground().background(background).padding(padding)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) modifier = modifier.cornerRadius(android.R.dimen.system_app_widget_background_radius)
    if (onClick != null) modifier = modifier.clickable(onClick)
    Box(modifier = modifier) { content() }
}

/** A small, bold, upper-case line above a widget's content. */
@Composable
@GlanceComposable
fun Eyebrow(text: String, color: ColorProvider = GlanceTheme.colors.onSurfaceVariant, modifier: GlanceModifier = GlanceModifier) {
    Text(
        text = text.uppercase(Locale.getDefault()),
        style = TextStyle(color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold),
        maxLines = 1,
        modifier = modifier,
    )
}

@Composable
fun Line(
    text: String,
    size: TextUnit = 13.sp,
    color: ColorProvider = GlanceTheme.colors.onSurface,
    weight: FontWeight = FontWeight.Normal,
    maxLines: Int = 1,
    modifier: GlanceModifier = GlanceModifier,
) {
    Text(text = text, style = TextStyle(color = color, fontSize = size, fontWeight = weight), maxLines = maxLines, modifier = modifier)
}

/** An icon in a tinted circle: a booking's kind, a stop's category. */
@Composable
fun IconBadge(symbol: String?, tint: ColorProvider, background: ColorProvider, size: Dp = 28.dp) {
    Box(
        modifier = GlanceModifier.size(size).background(background).cornerRadius(size / 2),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            provider = TrekIcons.provider(symbol),
            contentDescription = null,
            colorFilter = ColorFilter.tint(tint),
            modifier = GlanceModifier.size(size * 0.58f),
        )
    }
}

@Composable
fun Icon(vector: ImageVector, tint: ColorProvider, size: Dp = 14.dp) {
    Image(provider = TrekIcons.provider(vector), contentDescription = null, colorFilter = ColorFilter.tint(tint), modifier = GlanceModifier.size(size))
}

@Composable
fun SymbolIcon(symbol: String, tint: ColorProvider, size: Dp = 14.dp) {
    Image(provider = TrekIcons.provider(symbol), contentDescription = null, colorFilter = ColorFilter.tint(tint), modifier = GlanceModifier.size(size))
}

/** A rounded pill with a short text: a date range, a weather reading, a status. */
@Composable
fun Chip(
    text: String,
    background: ColorProvider,
    color: ColorProvider,
    leading: ImageProvider? = null,
    leadingTint: ColorProvider? = null,
) {
    Row(
        modifier = GlanceModifier.background(background).cornerRadius(100.dp).padding(horizontal = 8.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (leading != null) {
            Image(
                provider = leading,
                contentDescription = null,
                colorFilter = leadingTint?.let { ColorFilter.tint(it) },
                modifier = GlanceModifier.size(12.dp),
            )
            Spacer(GlanceModifier.width(4.dp))
        }
        Text(text = text, style = TextStyle(color = color, fontSize = 11.sp, fontWeight = FontWeight.Medium), maxLines = 1)
    }
}

@Composable
fun WeatherChip(weather: WidgetSnapshot.Weather, onPhoto: Boolean) {
    Chip(
        text = "${weather.temp}°",
        background = if (onPhoto) TrekStatus.glass else GlanceTheme.colors.secondaryContainer,
        color = if (onPhoto) TrekStatus.white else GlanceTheme.colors.onSecondaryContainer,
        leading = TrekIcons.provider(TrekIcons.weather(weather.main)),
        leadingTint = if (onPhoto) TrekStatus.white else GlanceTheme.colors.onSecondaryContainer,
    )
}

/** A horizontal bar of [value] (0..1): Glance's progress indicator, rounded. */
@Composable
fun Bar(value: Float, color: ColorProvider, track: ColorProvider, height: Dp = 6.dp, modifier: GlanceModifier = GlanceModifier.fillMaxWidth()) {
    androidx.glance.appwidget.LinearProgressIndicator(
        progress = value.coerceIn(0f, 1f),
        color = color,
        backgroundColor = track,
        modifier = modifier.height(height).cornerRadius(height / 2),
    )
}

/** The day segments of a trip: one bar per day, filled up to today. Drawn as one image (a Row takes ten children at most). */
@Composable
fun DaySegments(index: Int, total: Int, color: ColorProvider) {
    Image(
        provider = ImageProvider(WidgetArt.segments(index, total)),
        contentDescription = "$index / $total",
        colorFilter = ColorFilter.tint(color),
        contentScale = androidx.glance.layout.ContentScale.FillBounds,
        modifier = GlanceModifier.fillMaxWidth().height(4.dp),
    )
}

/** Relative days and ranges in the device's language. */
object RelativeDay {
    fun label(iso: String?, labels: WidgetSnapshot.Labels, today: LocalDate = LocalDate.now(), locale: Locale = Locale.getDefault()): String? {
        val date = WidgetSnapshot.day(iso) ?: return null
        val days = ChronoUnit.DAYS.between(today, date)
        if (days == 0L) return labels.todayShort
        if (days == 1L) return labels.tomorrowShort
        val skeleton = if (days in 2..6) "EEE" else "EEEdMMM"
        return DateTimeFormatter.ofPattern(DateFormat.getBestDateTimePattern(locale, skeleton), locale).format(date)
    }

    /** "1-9 Oct" in the device's own way of writing a range. */
    fun range(context: Context, start: String, end: String): String? {
        val from = WidgetSnapshot.day(start) ?: return null
        val to = WidgetSnapshot.day(end) ?: return null
        val zone = java.time.ZoneId.systemDefault()
        val startMs = from.atStartOfDay(zone).toInstant().toEpochMilli()
        // formatDateRange's end is exclusive: noon of the last day keeps it in the range.
        val endMs = to.atTime(12, 0).atZone(zone).toInstant().toEpochMilli()
        val flags = android.text.format.DateUtils.FORMAT_SHOW_DATE or android.text.format.DateUtils.FORMAT_ABBREV_MONTH or
            android.text.format.DateUtils.FORMAT_NO_YEAR
        return android.text.format.DateUtils.formatDateRange(context, startMs, endMs, flags)
    }
}

/** Minutes after midnight, now. */
fun nowMinutes(): Int = java.time.LocalTime.now().let { it.hour * 60 + it.minute }

/** "#rrggbb" as a colour, null for anything else. */
fun cssColor(css: String?): ColorProvider? {
    val hex = css?.removePrefix("#") ?: return null
    if (hex.length != 6) return null
    val value = hex.toLongOrNull(16) ?: return null
    return ColorProvider(Color(0xFF000000 or value))
}
