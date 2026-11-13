package com.liketrek.trek.widget

import android.content.Context
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Flight
import androidx.compose.material.icons.rounded.Group
import androidx.compose.material.icons.rounded.Luggage
import androidx.compose.material.icons.rounded.Place
import androidx.compose.material.icons.rounded.Public
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ColumnScope
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import java.time.LocalDate

/** The sizes every TREK widget lays itself out for (a 2x2, a 4x2 and a 4x4 cell block). */
object TrekSizes {
    val SMALL = DpSize(120.dp, 120.dp)
    val WIDE = DpSize(250.dp, 120.dp)
    val LARGE = DpSize(250.dp, 260.dp)
    val all = setOf(SMALL, WIDE, LARGE)
}

private val DpSize.isWide get() = width >= 220.dp
private val DpSize.isTall get() = height >= 220.dp

/**
 * A TREK widget: reads the snapshot of the trip it is set to (WidgetStore) and
 * draws [Content]. The app writes the snapshot and refreshes the widgets
 * (TrekWidgetUpdater); [preview] draws the same views from a sample trip for
 * the widget picker and the screenshot tests.
 */
abstract class TrekWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Responsive(TrekSizes.all)
    override val previewSizeMode = SizeMode.Responsive(TrekSizes.all)

    /** Whether the widget shows one trip, so the trip picker applies to it. */
    open val perTrip: Boolean = true

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val appWidgetId = runCatching { GlanceAppWidgetManager(context).getAppWidgetId(id) }.getOrDefault(-1)
        provideContent {
            // Read inside the composition: a session outlives one update, and every
            // write (the dashboard's, then each trip's) must reach it.
            val version by WidgetStore.version.collectAsState()
            val snapshot = remember(version) {
                val tripId = if (perTrip && appWidgetId >= 0) WidgetStore.tripFor(context, appWidgetId) else WidgetStore.AUTO
                WidgetStore.load(context, tripId)
            }
            TrekWidgetTheme.Themed { Content(snapshot) }
        }
    }

    override suspend fun providePreview(context: Context, widgetCategory: Int) {
        provideContent { TrekWidgetTheme.Themed { Content(WidgetSamples.snapshot(running = false)) } }
    }

    @Composable
    abstract fun Content(snapshot: WidgetSnapshot?)
}

// ---- Trip ----

/** The trip: a countdown on its own cover before it starts, the day and what comes next while it runs. */
class TripWidget : TrekWidget() {
    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val trip = snapshot?.trip
        if (snapshot == null || trip == null) {
            EmptyWidget(snapshot?.labels?.noTrip ?: WidgetSamples.emptyText(context))
            return
        }
        val size = LocalSize.current
        WidgetFrame(onClick = openPath(context, trip.path), background = TrekStatus.scrim, padding = 0.dp) {
            Box(modifier = GlanceModifier.fillMaxSize()) {
                Image(
                    provider = ImageProvider(WidgetArt.cover(trip.cover) ?: WidgetArt.sky(trip.title)),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = GlanceModifier.fillMaxSize(),
                )
                Image(
                    provider = ImageProvider(com.liketrek.trek.R.drawable.widget_scrim),
                    contentDescription = null,
                    contentScale = ContentScale.FillBounds,
                    modifier = GlanceModifier.fillMaxSize(),
                )
                Column(modifier = GlanceModifier.fillMaxSize().padding(14.dp)) {
                    val today = snapshot.today
                    if (today != null) Running(snapshot, trip, today, size) else Upcoming(snapshot, trip, size)
                }
            }
        }
    }

    @Composable
    private fun ColumnScope.Upcoming(snapshot: WidgetSnapshot, trip: WidgetSnapshot.Trip, size: DpSize) {
        val context = LocalContext.current
        val labels = snapshot.labels
        val days = (snapshot.daysUntilStart() ?: 0L).coerceAtLeast(0L)
        if (!size.isWide) {
            // Small: the number carries it, with the trip's name under it.
            Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Rounded.Flight, TrekStatus.white, 16.dp)
                Spacer(GlanceModifier.defaultWeight())
                snapshot.weather?.let { WeatherChip(it, onPhoto = true) }
            }
            Spacer(GlanceModifier.defaultWeight())
            Countdown(days, labels, ring = false)
            Line(trip.title, 14.sp, TrekStatus.white, FontWeight.Bold, maxLines = 1)
            return
        }
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                Eyebrow(labels.nextTrip, TrekStatus.whiteMuted)
                Spacer(GlanceModifier.height(2.dp))
                Line(trip.title, if (size.isTall) 22.sp else 18.sp, TrekStatus.white, FontWeight.Bold, maxLines = 2)
                trip.place?.let {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.Place, TrekStatus.whiteMuted, 12.dp)
                        Spacer(GlanceModifier.width(3.dp))
                        Line(it, 12.sp, TrekStatus.whiteMuted, FontWeight.Medium)
                    }
                }
                if (size.isTall) {
                    RelativeDay.range(context, trip.start, trip.end)?.let {
                        Spacer(GlanceModifier.height(6.dp))
                        Chip(it, TrekStatus.glass, TrekStatus.white, TrekIcons.provider(Icons.Rounded.CalendarMonth), TrekStatus.white)
                    }
                }
            }
            Spacer(GlanceModifier.width(10.dp))
            Countdown(days, labels, ring = true)
        }
        if (size.isTall) {
            Spacer(GlanceModifier.defaultWeight())
            TripFacts(snapshot, onPhoto = true)
            snapshot.bookings.firstOrNull()?.let {
                Spacer(GlanceModifier.height(8.dp))
                BookingRow(it, labels, onPhoto = true)
            }
        }
    }

    /** The days to go: a big number, or today and tomorrow in words; around a ring of the last 60 days on the wide sizes. */
    @Composable
    private fun Countdown(days: Long, labels: WidgetSnapshot.Labels, ring: Boolean) {
        val number: @Composable () -> Unit = {
            when (days) {
                0L -> Line(labels.todayShort, 26.sp, TrekStatus.white, FontWeight.Bold)
                1L -> Line(labels.tomorrow, 20.sp, TrekStatus.white, FontWeight.Bold)
                else -> if (ring) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = days.toString(),
                            style = TextStyle(color = TrekStatus.white, fontSize = if (days > 99) 22.sp else 28.sp, fontWeight = FontWeight.Bold),
                            maxLines = 1,
                        )
                        Eyebrow(labels.days, TrekStatus.whiteMuted)
                    }
                } else {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(days.toString(), style = TextStyle(color = TrekStatus.white, fontSize = 34.sp, fontWeight = FontWeight.Bold), maxLines = 1)
                        Spacer(GlanceModifier.width(4.dp))
                        Line(labels.days, 13.sp, TrekStatus.whiteMuted, FontWeight.Bold, modifier = GlanceModifier.padding(bottom = 6.dp))
                    }
                }
            }
        }
        if (!ring) {
            number()
            return
        }
        val progress = 1f - (days.coerceAtMost(60L).toFloat() / 60f)
        Box(modifier = GlanceModifier.size(84.dp), contentAlignment = Alignment.Center) {
            Image(
                provider = ImageProvider(WidgetArt.ring(progress)),
                contentDescription = null,
                colorFilter = ColorFilter.tint(TrekStatus.white),
                modifier = GlanceModifier.fillMaxSize(),
            )
            number()
        }
    }

    @Composable
    private fun ColumnScope.Running(snapshot: WidgetSnapshot, trip: WidgetSnapshot.Trip, today: WidgetSnapshot.Today, size: DpSize) {
        val labels = snapshot.labels
        val now = nowMinutes()
        val next = today.stops.firstOrNull { (it.minutes ?: -1) >= now } ?: today.stops.lastOrNull()
        val index = today.index ?: 1
        val total = today.total ?: snapshot.tripLength ?: 1
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Eyebrow(if (size.isWide) trip.title else today.dayLabel, TrekStatus.whiteMuted, GlanceModifier.defaultWeight())
            snapshot.weather?.let { WeatherChip(it, onPhoto = true) }
        }
        if (size.isWide) Line(today.dayLabel, 20.sp, TrekStatus.white, FontWeight.Bold, modifier = GlanceModifier.padding(top = 2.dp))
        Spacer(GlanceModifier.height(8.dp))
        DaySegments(index, total, TrekStatus.white)
        Spacer(GlanceModifier.defaultWeight())
        if (size.isWide) {
            Column(modifier = GlanceModifier.fillMaxWidth().background(TrekStatus.glass).cornerRadius(16.dp).padding(10.dp)) {
                StopList(today.stops, now, limit = if (size.isTall) 5 else 1, onPhoto = true, nothing = labels.nothingPlanned, nowLabel = labels.now)
            }
        } else if (next != null) {
            Line(next.time ?: labels.today, 26.sp, TrekStatus.white, FontWeight.Bold)
            Line(next.name, 14.sp, TrekStatus.white, FontWeight.Bold, maxLines = 2)
        } else {
            Line(labels.nothingPlanned, 14.sp, TrekStatus.white, FontWeight.Bold, maxLines = 3)
        }
    }
}

/** The trip's numbers: days, places, travellers. */
@Composable
private fun TripFacts(snapshot: WidgetSnapshot, onPhoto: Boolean) {
    val labels = snapshot.labels
    val facts = listOfNotNull(
        snapshot.tripLength?.let { it to labels.days },
        snapshot.trip?.placeCount?.let { it to labels.places },
        snapshot.trip?.memberCount?.let { it to labels.travellers },
    )
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        facts.forEachIndexed { i, (value, label) ->
            Column(
                modifier = GlanceModifier.defaultWeight().background(if (onPhoto) TrekStatus.glass else GlanceTheme.colors.secondaryContainer)
                    .cornerRadius(14.dp).padding(horizontal = 10.dp, vertical = 6.dp),
            ) {
                Line(value.toString(), 18.sp, if (onPhoto) TrekStatus.white else GlanceTheme.colors.onSecondaryContainer, FontWeight.Bold)
                Line(label, 11.sp, if (onPhoto) TrekStatus.whiteMuted else GlanceTheme.colors.onSecondaryContainer)
            }
            if (i < facts.size - 1) Spacer(GlanceModifier.width(6.dp))
        }
    }
}

// ---- Today ----

/** Today's plan as a timeline, with the weather and what is next. */
class TodayWidget : TrekWidget() {
    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val size = LocalSize.current
        val labels = snapshot?.labels
        val today = snapshot?.today
        val trip = snapshot?.trip
        if (snapshot == null || labels == null || trip == null) {
            EmptyWidget(labels?.noTrip ?: WidgetSamples.emptyText(context))
            return
        }
        WidgetFrame(onClick = openPath(context, trip.path)) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = GlanceModifier.defaultWeight()) {
                        if (size.isTall) Eyebrow(if (today != null) labels.today else labels.nextTrip, GlanceTheme.colors.primary)
                        Line(today?.dayLabel ?: trip.title, if (size.isWide) 17.sp else 14.sp, weight = FontWeight.Bold)
                    }
                    snapshot.weather?.let { WeatherChip(it, onPhoto = false) }
                }
                Spacer(GlanceModifier.height(if (size.isTall) 10.dp else 6.dp))
                if (today == null || today.stops.isEmpty()) {
                    Spacer(GlanceModifier.defaultWeight())
                    val days = snapshot.daysUntilStart()
                    val text = if (today == null && days != null && days > 0) labels.inDays.replace("{n}", days.toString()) else labels.nothingPlanned
                    Line(text, 14.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium, maxLines = 3)
                    Spacer(GlanceModifier.defaultWeight())
                } else {
                    val limit = when {
                        size.isTall -> 6
                        size.isWide -> 2
                        else -> 1
                    }
                    StopList(today.stops, nowMinutes(), limit, onPhoto = false, nothing = labels.nothingPlanned, nowLabel = labels.now, compact = !size.isWide)
                }
            }
        }
    }
}

/** The stops from the next one on, at most [limit], the next one marked. */
@Composable
fun StopList(
    stops: List<WidgetSnapshot.Stop>,
    nowMinutes: Int,
    limit: Int,
    onPhoto: Boolean,
    nothing: String,
    nowLabel: String,
    compact: Boolean = false,
) {
    if (stops.isEmpty()) {
        Line(nothing, 13.sp, if (onPhoto) TrekStatus.white else GlanceTheme.colors.onSurfaceVariant)
        return
    }
    val nextIndex = stops.indexOfFirst { (it.minutes ?: -1) >= nowMinutes }.let { if (it < 0) stops.size - 1 else it }
    // Keep the last done stop in view when there is room, so the day reads as a line.
    val from = (nextIndex - if (limit > 3) 1 else 0).coerceIn(0, (stops.size - limit).coerceAtLeast(0))
    val shown = stops.drop(from).take(limit)
    shown.forEachIndexed { i, stop ->
        val index = from + i
        val isNext = index == nextIndex
        val done = index < nextIndex
        val ink = when {
            onPhoto -> if (done) TrekStatus.whiteFaint else TrekStatus.white
            done -> GlanceTheme.colors.onSurfaceVariant
            else -> GlanceTheme.colors.onSurface
        }
        Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
            val accent = cssColor(stop.color) ?: if (onPhoto) TrekStatus.white else GlanceTheme.colors.primary
            if (compact) {
                Box(modifier = GlanceModifier.size(8.dp).cornerRadius(4.dp).background(accent)) {}
            } else {
                IconBadge(
                    stop.symbol,
                    tint = if (onPhoto) TrekStatus.white else GlanceTheme.colors.onSecondaryContainer,
                    background = if (onPhoto) TrekStatus.glass else GlanceTheme.colors.secondaryContainer,
                    size = 26.dp,
                )
            }
            Spacer(GlanceModifier.width(8.dp))
            Column(modifier = GlanceModifier.defaultWeight()) {
                Line(stop.name, 13.sp, ink, if (isNext) FontWeight.Bold else FontWeight.Medium)
                if (compact && stop.time != null) Line(stop.time, 11.sp, if (onPhoto) TrekStatus.whiteMuted else GlanceTheme.colors.onSurfaceVariant)
            }
            if (!compact) {
                if (isNext && !onPhoto) {
                    Chip(stop.time ?: nowLabel, GlanceTheme.colors.primary, GlanceTheme.colors.onPrimary)
                } else {
                    Line(stop.time ?: "", 12.sp, ink, if (isNext) FontWeight.Bold else FontWeight.Normal)
                }
            }
        }
    }
}

// ---- Bookings ----

/** The next flights, trains, hotels and tables, and when they are due. */
class BookingsWidget : TrekWidget() {
    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val size = LocalSize.current
        val labels = snapshot?.labels ?: return EmptyWidget(WidgetSamples.emptyText(context))
        val bookings = snapshot.bookings
        WidgetFrame(onClick = openPath(context, bookings.firstOrNull()?.path ?: snapshot.trip?.path ?: "/")) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Flight, GlanceTheme.colors.primary, 14.dp)
                    Spacer(GlanceModifier.width(5.dp))
                    Eyebrow(labels.bookings, GlanceTheme.colors.primary)
                }
                Spacer(GlanceModifier.height(8.dp))
                if (bookings.isEmpty()) {
                    Spacer(GlanceModifier.defaultWeight())
                    Line(labels.noBookings, 14.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium, maxLines = 2)
                    Spacer(GlanceModifier.defaultWeight())
                } else if (!size.isWide) {
                    val first = bookings.first()
                    val (symbol, color) = TrekIcons.booking(first.kind)
                    IconBadge(symbol, TrekStatus.white, ColorProvider(androidx.compose.ui.graphics.Color(color)), 30.dp)
                    Spacer(GlanceModifier.defaultWeight())
                    Line(first.title, 14.sp, weight = FontWeight.Bold, maxLines = 1)
                    Line(
                        listOfNotNull(RelativeDay.label(first.date, labels), first.time).joinToString(", "),
                        12.sp,
                        GlanceTheme.colors.onSurfaceVariant,
                    )
                } else {
                    val limit = if (size.isTall) 4 else 1
                    bookings.take(limit).forEach { booking ->
                        BookingRow(booking, labels, onPhoto = false)
                        Spacer(GlanceModifier.height(5.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun BookingRow(booking: WidgetSnapshot.Booking, labels: WidgetSnapshot.Labels, onPhoto: Boolean) {
    val context = LocalContext.current
    val (symbol, color) = TrekIcons.booking(booking.kind)
    Row(
        modifier = GlanceModifier.fillMaxWidth()
            .background(if (onPhoto) TrekStatus.glass else GlanceTheme.colors.surfaceVariant)
            .cornerRadius(14.dp).padding(horizontal = 8.dp, vertical = 6.dp)
            .clickable(openPath(context, booking.path)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconBadge(symbol, TrekStatus.white, ColorProvider(androidx.compose.ui.graphics.Color(color)), 30.dp)
        Spacer(GlanceModifier.width(10.dp))
        Column(modifier = GlanceModifier.defaultWeight()) {
            Line(booking.title, 13.sp, if (onPhoto) TrekStatus.white else GlanceTheme.colors.onSurface, FontWeight.Bold)
            booking.detail?.let { Line(it, 11.sp, if (onPhoto) TrekStatus.whiteMuted else GlanceTheme.colors.onSurfaceVariant) }
        }
        Spacer(GlanceModifier.width(6.dp))
        Column(horizontalAlignment = Alignment.End) {
            RelativeDay.label(booking.date, labels)?.let { Line(it, 12.sp, if (onPhoto) TrekStatus.white else GlanceTheme.colors.onSurface, FontWeight.Bold) }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = GlanceModifier.size(6.dp).cornerRadius(3.dp).background(if (booking.confirmed) TrekStatus.confirmed else TrekStatus.pending)) {}
                Spacer(GlanceModifier.width(4.dp))
                Line(booking.time ?: if (booking.confirmed) labels.confirmed else labels.pending, 11.sp, if (onPhoto) TrekStatus.whiteMuted else GlanceTheme.colors.onSurfaceVariant)
            }
        }
    }
}

// ---- Flight ----

/**
 * Where a flight stands now (as FlightMoment on iOS). What the feed saw wins: a
 * flight still at the gate past its planned departure is not flown along the
 * arc, and it is only landed once confirmed. Only a flight the feed never heard
 * of moves on by its schedule alone; a lost one stops two hours after arrival.
 */
private class FlightMoment(f: WidgetSnapshot.Flight, nowSeconds: Long) {
    val start: Long = f.depActual ?: f.depExpected ?: f.dep
    val end: Long = maxOf(f.arrExpected ?: f.arr, start + 60)
    private val heard = f.seen != null
    val landed = f.landed || (!heard && nowSeconds >= end) || nowSeconds >= end + 7200
    val airborne = !landed && (f.airborne || f.depActual != null || (!heard && nowSeconds >= start))
    val ready = !landed && !airborne && nowSeconds >= start
    val progress: Float = when {
        landed -> 1f
        airborne -> ((nowSeconds - start).toFloat() / (end - start)).coerceIn(0f, 0.98f)
        else -> 0f
    }
}

/** A duration in the app's words: "2 d 4 h", "1 h 5 min", "12 min". */
private fun durationText(seconds: Long, labels: WidgetSnapshot.Labels): String {
    val minutes = ((seconds + 59) / 60).coerceAtLeast(1)
    val days = minutes / 1440
    val hours = (minutes % 1440) / 60
    val rest = minutes % 60
    return when {
        days > 0 -> labels.durDaysHours.replace("{d}", "$days").replace("{h}", "$hours")
        hours > 0 -> labels.durHoursMinutes.replace("{h}", "$hours").replace("{m}", "$rest")
        else -> labels.durMinutes.replace("{m}", "$rest")
    }
}

/** "Departs in 2 h 10 min", "Lands in 1 h 5 min", "Landed". */
private fun momentText(m: FlightMoment, labels: WidgetSnapshot.Labels, nowSeconds: Long): String = when {
    m.landed -> labels.flightLanded
    m.ready -> labels.flightReady
    m.airborne -> labels.flightLands.replace("{time}", durationText(m.end - nowSeconds, labels))
    else -> labels.flightDeparts.replace("{time}", durationText(m.start - nowSeconds, labels))
}

/** The delay as a chip's text and colour; nothing to say without data. */
private fun delayChip(delay: Int?, labels: WidgetSnapshot.Labels): Pair<String, ColorProvider>? = when {
    delay == null -> null
    delay > 5 -> labels.flightLate.replace("{m}", "$delay") to (if (delay >= 30) TrekStatus.danger else TrekStatus.pending)
    delay < -5 -> labels.flightEarly.replace("{m}", "${-delay}") to TrekStatus.confirmed
    else -> labels.flightOnTime to TrekStatus.confirmed
}

private const val FLIGHT_BLUE = 0xFF4A7DDB.toInt()

/**
 * The trip's next flight, or the one in the air: both airports large, the
 * route as an arc with the aircraft on it, the moment in words and the delay.
 * The arc and the words follow the clock each time the widget is drawn.
 */
class FlightWidget : TrekWidget() {
    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val size = LocalSize.current
        val labels = snapshot?.labels ?: return EmptyWidget(WidgetSamples.emptyText(context))
        val flight = snapshot.flight
        WidgetFrame(onClick = openPath(context, flight?.path ?: snapshot.trip?.path ?: "/")) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = GlanceModifier.fillMaxWidth()) {
                    Icon(Icons.Rounded.Flight, GlanceTheme.colors.primary, 14.dp)
                    Spacer(GlanceModifier.width(5.dp))
                    Eyebrow(flight?.number ?: labels.flight, GlanceTheme.colors.primary, GlanceModifier.defaultWeight())
                    flight?.let { f ->
                        delayChip(f.delay, labels)?.let { (text, color) ->
                            if (size.isWide || (f.delay ?: 0) > 5) Chip(text, GlanceTheme.colors.surfaceVariant, color)
                        }
                    }
                }
                if (flight == null) {
                    Spacer(GlanceModifier.defaultWeight())
                    Line(labels.noFlight, 14.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium, maxLines = 2)
                    Spacer(GlanceModifier.defaultWeight())
                } else {
                    FlightBody(flight, labels, size.isWide, size.isTall)
                }
            }
        }
    }
}

/** The origin stands on the right in a right-to-left layout, so the drawn arc is mirrored with it. */
@Composable
private fun isRtl(): Boolean =
    LocalContext.current.resources.configuration.layoutDirection == android.view.View.LAYOUT_DIRECTION_RTL

@Composable
private fun ColumnScope.FlightBody(f: WidgetSnapshot.Flight, labels: WidgetSnapshot.Labels, wide: Boolean, tall: Boolean) {
    val now = System.currentTimeMillis() / 1000
    val m = FlightMoment(f, now)
    val arrival = f.arrTimeExpected ?: f.arrTime
    val momentColor = if (m.airborne) GlanceTheme.colors.primary else GlanceTheme.colors.onSurface
    Spacer(GlanceModifier.defaultWeight())
    if (!wide) Line(momentText(m, labels, now), 13.sp, momentColor, FontWeight.Bold, maxLines = 2)
    Spacer(GlanceModifier.height(6.dp))
    Row(verticalAlignment = Alignment.CenterVertically, modifier = GlanceModifier.fillMaxWidth()) {
        Column(modifier = GlanceModifier.defaultWeight()) {
            Line(f.from, if (wide) 26.sp else 22.sp, weight = FontWeight.Bold)
            if (wide) f.fromCity?.let { Line(it, 11.sp, GlanceTheme.colors.onSurfaceVariant) }
        }
        if (wide) {
            Image(
                provider = ImageProvider(WidgetArt.flightArc(m.progress, FLIGHT_BLUE, android.graphics.Color.argb(90, 120, 120, 130), rtl = isRtl())),
                contentDescription = null,
                contentScale = ContentScale.Fit,
                modifier = GlanceModifier.width(120.dp).height(26.dp),
            )
        }
        Column(modifier = GlanceModifier.defaultWeight(), horizontalAlignment = Alignment.End) {
            Line(f.to, if (wide) 26.sp else 22.sp, weight = FontWeight.Bold)
            if (wide) f.toCity?.let { Line(it, 11.sp, GlanceTheme.colors.onSurfaceVariant) }
        }
    }
    if (!wide) {
        Image(
            provider = ImageProvider(WidgetArt.flightArc(m.progress, FLIGHT_BLUE, android.graphics.Color.argb(90, 120, 120, 130), rtl = isRtl())),
            contentDescription = null,
            contentScale = ContentScale.FillBounds,
            modifier = GlanceModifier.fillMaxWidth().height(22.dp),
        )
    }
    Spacer(GlanceModifier.height(4.dp))
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        Line(f.depTime, 12.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Bold, modifier = GlanceModifier.defaultWeight())
        Line(arrival, 12.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Bold)
    }
    if (wide) {
        Spacer(GlanceModifier.height(8.dp))
        Line(momentText(m, labels, now), 13.sp, momentColor, FontWeight.Bold)
        if (m.airborne) {
            Spacer(GlanceModifier.height(5.dp))
            Bar(m.progress, GlanceTheme.colors.primary, GlanceTheme.colors.surfaceVariant, 5.dp)
        }
    }
    if (tall) {
        Spacer(GlanceModifier.height(10.dp))
        f.aircraft?.let { FlightFact(it) }
        f.fromCity?.let { from -> f.toCity?.let { to -> FlightFact("$from \u2192 $to") } }
    }
    Spacer(GlanceModifier.defaultWeight())
}

@Composable
private fun FlightFact(text: String) {
    Row(
        modifier = GlanceModifier.fillMaxWidth().background(GlanceTheme.colors.surfaceVariant).cornerRadius(12.dp)
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Rounded.Flight, GlanceTheme.colors.primary, 13.dp)
        Spacer(GlanceModifier.width(7.dp))
        Line(text, 12.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium)
    }
    Spacer(GlanceModifier.height(5.dp))
}

// ---- To-dos ----

/** What is still open for the trip, and how far the packing has come. */
class TodosWidget : TrekWidget() {
    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val size = LocalSize.current
        val labels = snapshot?.labels ?: return EmptyWidget(WidgetSamples.emptyText(context))
        val todos = snapshot.todos
        WidgetFrame(onClick = openPath(context, todos?.path ?: snapshot.trip?.path ?: "/")) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.CheckCircle, GlanceTheme.colors.primary, 14.dp)
                    Spacer(GlanceModifier.width(5.dp))
                    Eyebrow(labels.todos, GlanceTheme.colors.primary, GlanceModifier.defaultWeight())
                    if (todos != null && todos.total > 0) Line("${todos.total - todos.open}/${todos.total}", 12.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Bold)
                }
                Spacer(GlanceModifier.height(8.dp))
                if (todos == null || todos.open == 0) {
                    Spacer(GlanceModifier.defaultWeight())
                    Line(labels.noTodos, 16.sp, weight = FontWeight.Bold)
                    snapshot.trip?.title?.let { Line(it, 12.sp, GlanceTheme.colors.onSurfaceVariant) }
                    Spacer(GlanceModifier.defaultWeight())
                } else {
                    if (!size.isWide) {
                        Line(todos.open.toString(), 34.sp, GlanceTheme.colors.primary, FontWeight.Bold)
                        Spacer(GlanceModifier.defaultWeight())
                    }
                    val limit = when {
                        size.isTall -> 6
                        size.isWide -> 3
                        else -> 1
                    }
                    Column(modifier = GlanceModifier.fillMaxWidth()) {
                        todos.items.take(limit).forEach { todo ->
                            Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = GlanceModifier.size(14.dp).cornerRadius(7.dp).background(priorityColor(todo.priority) ?: GlanceTheme.colors.outline),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Box(modifier = GlanceModifier.size(10.dp).cornerRadius(5.dp).background(GlanceTheme.colors.widgetBackground)) {}
                                }
                                Spacer(GlanceModifier.width(8.dp))
                                Line(todo.name, 13.sp, modifier = GlanceModifier.defaultWeight())
                                if (size.isWide) RelativeDay.label(todo.due, labels)?.let { Line(it, 11.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium) }
                            }
                        }
                    }
                    if (size.isWide) Spacer(GlanceModifier.defaultWeight())
                }
                val packing = snapshot.packing
                if (size.isTall && packing != null && packing.total > 0) {
                    Spacer(GlanceModifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.Luggage, GlanceTheme.colors.onSurfaceVariant, 13.dp)
                        Spacer(GlanceModifier.width(5.dp))
                        Line("${labels.packing}: ${packing.packed}/${packing.total}", 12.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium)
                    }
                    Spacer(GlanceModifier.height(5.dp))
                    Bar(packing.packed.toFloat() / packing.total, GlanceTheme.colors.primary, GlanceTheme.colors.surfaceVariant)
                }
            }
        }
    }

    private fun priorityColor(priority: Int): ColorProvider? = when (priority) {
        3 -> TrekStatus.danger
        2 -> TrekStatus.pending
        1 -> ColorProvider(androidx.compose.ui.graphics.Color(0xFF4A7DDB))
        else -> null
    }
}

// ---- Packing ----

/** How full the bags are, their weight, and what is still missing. */
class PackingWidget : TrekWidget() {
    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val size = LocalSize.current
        val labels = snapshot?.labels ?: return EmptyWidget(WidgetSamples.emptyText(context))
        val packing = snapshot.packing
        WidgetFrame(onClick = openPath(context, packing?.path ?: snapshot.trip?.path ?: "/")) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Luggage, GlanceTheme.colors.primary, 14.dp)
                    Spacer(GlanceModifier.width(5.dp))
                    Eyebrow(labels.packing, GlanceTheme.colors.primary)
                }
                if (packing == null || packing.total == 0) {
                    Spacer(GlanceModifier.defaultWeight())
                    Line(snapshot.trip?.title ?: labels.noTrip, 14.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium, maxLines = 3)
                    Spacer(GlanceModifier.defaultWeight())
                    return@Column
                }
                val progress = packing.packed.toFloat() / packing.total
                Spacer(GlanceModifier.height(if (size.isWide) 8.dp else 4.dp))
                if (!size.isWide) {
                    // Small: the ring is the widget.
                    Box(modifier = GlanceModifier.fillMaxWidth().defaultWeight(), contentAlignment = Alignment.Center) {
                        PackRing(progress, 64.dp)
                    }
                    Line("${packing.packed}/${packing.total} ${labels.packed}", 11.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium)
                    return@Column
                }
                Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    PackRing(progress, 64.dp)
                    Spacer(GlanceModifier.width(12.dp))
                    Column(modifier = GlanceModifier.defaultWeight()) {
                        Line("${packing.packed}/${packing.total}", 18.sp, weight = FontWeight.Bold)
                        Line(labels.packed, 12.sp, GlanceTheme.colors.onSurfaceVariant)
                        if (!size.isTall && packing.missing.isNotEmpty()) {
                            Line("${packing.missing.size} ${labels.missing}", 12.sp, GlanceTheme.colors.primary, FontWeight.Medium)
                        }
                    }
                }
                if (size.isTall) {
                    Spacer(GlanceModifier.height(10.dp))
                    // Each group in a column of its own: a Glance column takes ten children at most.
                    Column(modifier = GlanceModifier.fillMaxWidth()) {
                        packing.bags.take(2).forEach { bag -> BagRow(bag) }
                    }
                    if (packing.missing.isNotEmpty()) {
                        Spacer(GlanceModifier.height(4.dp))
                        Column(modifier = GlanceModifier.fillMaxWidth()) {
                            Eyebrow(labels.missing)
                            Spacer(GlanceModifier.height(2.dp))
                            packing.missing.take(2).forEach { item ->
                                Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = GlanceModifier.size(6.dp).cornerRadius(3.dp).background(cssColor(item.color) ?: GlanceTheme.colors.outline)) {}
                                    Spacer(GlanceModifier.width(8.dp))
                                    Line(item.name, 12.sp, modifier = GlanceModifier.defaultWeight())
                                    item.category?.let { Line(it, 11.sp, GlanceTheme.colors.onSurfaceVariant) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun PackRing(progress: Float, size: androidx.compose.ui.unit.Dp) {
        Box(modifier = GlanceModifier.size(size), contentAlignment = Alignment.Center) {
            Image(
                provider = ImageProvider(WidgetArt.ring(progress, stroke = 16f)),
                contentDescription = null,
                colorFilter = ColorFilter.tint(GlanceTheme.colors.primary),
                modifier = GlanceModifier.fillMaxSize(),
            )
            Line("${(progress * 100).toInt()}%", 13.sp, weight = FontWeight.Bold)
        }
    }

    @Composable
    private fun BagRow(bag: WidgetSnapshot.Bag) {
        val bagColor = cssColor(bag.color) ?: GlanceTheme.colors.primary
        Column(modifier = GlanceModifier.fillMaxWidth().padding(bottom = 6.dp)) {
            Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = GlanceModifier.size(8.dp).cornerRadius(4.dp).background(bagColor)) {}
                Spacer(GlanceModifier.width(6.dp))
                Line(bag.name, 12.sp, weight = FontWeight.Medium, modifier = GlanceModifier.defaultWeight())
                Line(weight(bag.grams) + (bag.limit?.let { " / ${weight(it)}" } ?: ""), 11.sp, GlanceTheme.colors.onSurfaceVariant)
            }
            Spacer(GlanceModifier.height(4.dp))
            Bar(if (bag.limit != null && bag.limit > 0) bag.grams.toFloat() / bag.limit else bag.packed.toFloat() / bag.total.coerceAtLeast(1), bagColor, GlanceTheme.colors.surfaceVariant, 5.dp)
        }
    }

    private fun weight(grams: Int): String = if (grams >= 1000) "%.1f kg".format(grams / 1000f) else "$grams g"
}

// ---- Atlas ----

/** The countries the user has been to, glowing on the world map. Not tied to a trip. */
class AtlasWidget : TrekWidget() {
    override val perTrip = false

    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val size = LocalSize.current
        val labels = snapshot?.labels ?: return EmptyWidget(WidgetSamples.emptyText(context))
        val atlas = snapshot.atlas
        val codes = atlas?.codes?.toSet() ?: emptySet()
        WidgetFrame(onClick = openPath(context, "/atlas")) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Public, GlanceTheme.colors.primary, 14.dp)
                    Spacer(GlanceModifier.width(5.dp))
                    Eyebrow(context.getString(com.liketrek.trek.R.string.widget_atlas_name), GlanceTheme.colors.primary)
                }
                Spacer(GlanceModifier.height(4.dp))
                val count: @Composable () -> Unit = {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Line((atlas?.count ?: 0).toString(), if (size.isWide) 34.sp else 30.sp, GlanceTheme.colors.onSurface, FontWeight.Bold)
                        Spacer(GlanceModifier.width(6.dp))
                        Column(modifier = GlanceModifier.padding(bottom = 4.dp)) {
                            Line(labels.countries, 12.sp, GlanceTheme.colors.onSurface, FontWeight.Bold)
                            // 195 countries make the world, as on the Atlas page.
                            if (size.isWide) Line("${((atlas?.count ?: 0) * 100 / 195)}% ${labels.world}", 11.sp, GlanceTheme.colors.onSurfaceVariant)
                        }
                    }
                }
                if (size.isWide && !size.isTall) {
                    // Wide: the count beside the map, which gets the height.
                    Row(modifier = GlanceModifier.fillMaxWidth().defaultWeight(), verticalAlignment = Alignment.CenterVertically) {
                        count()
                        Spacer(GlanceModifier.width(10.dp))
                        WorldMap(codes, GlanceModifier.defaultWeight().fillMaxHeight())
                    }
                } else {
                    count()
                    Spacer(GlanceModifier.height(6.dp))
                    WorldMap(codes, GlanceModifier.fillMaxWidth().defaultWeight())
                }
                if (size.isTall && atlas != null) {
                    Spacer(GlanceModifier.height(10.dp))
                    Row(modifier = GlanceModifier.fillMaxWidth()) {
                        atlas.recent.take(4).forEach { country ->
                            Column(modifier = GlanceModifier.defaultWeight(), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(flag(country.code), style = TextStyle(fontSize = 20.sp, textAlign = TextAlign.Center))
                                Line(country.name, 10.sp, GlanceTheme.colors.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun WorldMap(codes: Set<String>, modifier: GlanceModifier) {
        Box(modifier = modifier) {
            Image(
                provider = ImageProvider(WidgetArt.worldDots(codes, visited = false)),
                contentDescription = null,
                colorFilter = ColorFilter.tint(GlanceTheme.colors.outline),
                contentScale = ContentScale.Fit,
                modifier = GlanceModifier.fillMaxSize(),
            )
            Image(
                provider = ImageProvider(WidgetArt.worldDots(codes, visited = true)),
                contentDescription = null,
                colorFilter = ColorFilter.tint(GlanceTheme.colors.primary),
                contentScale = ContentScale.Fit,
                modifier = GlanceModifier.fillMaxSize(),
            )
        }
    }

    /** The flag emoji of an ISO 3166-1 alpha-2 code. */
    private fun flag(code: String): String {
        if (code.length != 2) return ""
        val first = Character.toChars(0x1F1E6 + (code[0].uppercaseChar() - 'A'))
        val second = Character.toChars(0x1F1E6 + (code[1].uppercaseChar() - 'A'))
        return String(first) + String(second)
    }
}

// ---- Travel group ----

/** Who comes along, the latest messages and the open poll. */
class CollabWidget : TrekWidget() {
    @Composable
    override fun Content(snapshot: WidgetSnapshot?) {
        val context = LocalContext.current
        val size = LocalSize.current
        val labels = snapshot?.labels ?: return EmptyWidget(WidgetSamples.emptyText(context))
        val collab = snapshot.collab
        WidgetFrame(onClick = openPath(context, collab?.path ?: snapshot.trip?.path ?: "/")) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Group, GlanceTheme.colors.primary, 14.dp)
                    Spacer(GlanceModifier.width(5.dp))
                    if (size.isWide) Eyebrow(labels.group, GlanceTheme.colors.primary, GlanceModifier.defaultWeight()) else Spacer(GlanceModifier.defaultWeight())
                    collab?.members?.take(if (size.isWide) 4 else 3)?.forEach { member ->
                        Spacer(GlanceModifier.width(2.dp))
                        Initials(member.initials, 22.dp)
                    }
                }
                Spacer(GlanceModifier.height(8.dp))
                val messages = collab?.messages.orEmpty()
                if (messages.isEmpty() && collab?.poll == null) {
                    Spacer(GlanceModifier.defaultWeight())
                    Line(labels.noMessages, 14.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Medium, maxLines = 2)
                    Spacer(GlanceModifier.defaultWeight())
                    return@Column
                }
                messages.takeLast(if (size.isTall) (if (collab?.poll != null) 2 else 4) else 1).forEach { message ->
                    Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.Top) {
                        if (!message.mine) {
                            Initials(message.initials, 24.dp)
                            Spacer(GlanceModifier.width(6.dp))
                        } else {
                            Spacer(GlanceModifier.defaultWeight())
                        }
                        Column(
                            modifier = GlanceModifier
                                .background(if (message.mine) GlanceTheme.colors.primary else GlanceTheme.colors.surfaceVariant)
                                .cornerRadius(14.dp).padding(horizontal = 10.dp, vertical = 6.dp),
                        ) {
                            if (!message.mine && size.isWide) Line(message.author, 10.sp, GlanceTheme.colors.onSurfaceVariant, FontWeight.Bold)
                            Line(
                                message.text,
                                12.sp,
                                if (message.mine) GlanceTheme.colors.onPrimary else GlanceTheme.colors.onSurface,
                                maxLines = if (size.isWide) 2 else 3,
                            )
                        }
                    }
                }
                val poll = collab?.poll
                if (size.isTall && poll != null) {
                    Spacer(GlanceModifier.defaultWeight())
                    Column(modifier = GlanceModifier.fillMaxWidth().background(GlanceTheme.colors.secondaryContainer).cornerRadius(14.dp).padding(10.dp)) {
                        Eyebrow("${labels.poll}: ${poll.voters} ${labels.votes}", GlanceTheme.colors.onSecondaryContainer)
                        Line(poll.question, 13.sp, GlanceTheme.colors.onSecondaryContainer, FontWeight.Bold)
                        Spacer(GlanceModifier.height(4.dp))
                        val most = poll.options.maxOfOrNull { it.votes }?.coerceAtLeast(1) ?: 1
                        poll.options.take(3).forEach { option ->
                            Row(modifier = GlanceModifier.fillMaxWidth().padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                                Line(option.label, 12.sp, GlanceTheme.colors.onSecondaryContainer, modifier = GlanceModifier.width(70.dp))
                                Bar(option.votes.toFloat() / most, GlanceTheme.colors.primary, GlanceTheme.colors.surface, 5.dp, GlanceModifier.defaultWeight())
                                Spacer(GlanceModifier.width(6.dp))
                                Line(option.votes.toString(), 11.sp, GlanceTheme.colors.onSecondaryContainer, FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun Initials(text: String, size: androidx.compose.ui.unit.Dp) {
        Box(
            modifier = GlanceModifier.size(size).cornerRadius(size / 2).background(GlanceTheme.colors.tertiaryContainer),
            contentAlignment = Alignment.Center,
        ) {
            Text(text, style = TextStyle(color = GlanceTheme.colors.onTertiaryContainer, fontSize = 9.sp, fontWeight = FontWeight.Bold), maxLines = 1)
        }
    }
}

/** A widget with nothing to show yet: TREK's mark and what to do. */
@Composable
fun EmptyWidget(text: String) {
    val context = LocalContext.current
    WidgetFrame(onClick = openPath(context, "/")) {
        Column(modifier = GlanceModifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = GlanceModifier.size(34.dp).cornerRadius(11.dp).background(GlanceTheme.colors.primary),
                contentAlignment = Alignment.Center,
            ) {
                Text("T", style = TextStyle(color = GlanceTheme.colors.onPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold))
            }
            Spacer(GlanceModifier.height(10.dp))
            Line(text, 13.sp, GlanceTheme.colors.onSurface, FontWeight.Medium, maxLines = 4)
        }
    }
}
