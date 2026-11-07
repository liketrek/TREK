package com.liketrek.trek.widget

import java.time.LocalDate
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import org.json.JSONArray
import org.json.JSONObject

/**
 * What the app last told the widgets: client/src/native/widgets.ts builds it and
 * hands it over through TrekShell.setWidgetSnapshot, the same JSON the iOS
 * widgets read (client/ios/App/TREKWidgets/WidgetSnapshot.swift). Texts arrive
 * already translated, so a widget always speaks the language the app does.
 *
 * Everything past trip, today and labels is optional: a binary newer than the
 * server's UI shows what it gets, and unknown fields are ignored.
 */
data class WidgetSnapshot(
    val trip: Trip?,
    val today: Today?,
    val weather: Weather?,
    val bookings: List<Booking>,
    val todos: Todos?,
    val packing: Packing?,
    val atlas: Atlas?,
    val collab: Collab?,
    val labels: Labels,
) {
    data class Trip(
        val title: String,
        val start: String,
        val end: String,
        val path: String,
        val place: String?,
        /** A small JPEG of the cover, base64. */
        val cover: String?,
        val dayCount: Int?,
        val placeCount: Int?,
        val memberCount: Int?,
    )

    data class Stop(
        val time: String?,
        val name: String,
        /** Minutes after midnight. */
        val minutes: Int?,
        /** #rrggbb */
        val color: String?,
        /** The SF Symbol name the iOS widget uses; [TrekIcons] maps it. */
        val symbol: String?,
    )

    data class Today(val dayLabel: String, val stops: List<Stop>, val index: Int?, val total: Int?)

    data class Weather(
        val temp: Int,
        val high: Int?,
        val low: Int?,
        val main: String,
        val label: String,
        val place: String?,
        val rain: Int?,
    )

    data class Booking(
        val title: String,
        val kind: String,
        val date: String?,
        val time: String?,
        val detail: String?,
        val confirmed: Boolean,
        val path: String,
    )

    data class Todo(val name: String, val due: String?, val priority: Int)

    data class Todos(val open: Int, val total: Int, val items: List<Todo>, val path: String)

    data class Bag(val name: String, val color: String, val grams: Int, val limit: Int?, val packed: Int, val total: Int)

    data class PackItem(val name: String, val category: String?, val color: String?)

    data class Packing(val packed: Int, val total: Int, val path: String, val bags: List<Bag>, val missing: List<PackItem>)

    data class Country(val code: String, val name: String)

    data class Continent(val name: String, val count: Int)

    data class Atlas(
        val count: Int,
        val codes: List<String>,
        val recent: List<Country>,
        val continents: List<Continent>,
        val trips: Int?,
        val days: Int?,
    )

    data class Member(val name: String, val initials: String)

    data class Message(val author: String, val initials: String, val text: String, val at: String?, val mine: Boolean)

    data class PollOption(val label: String, val votes: Int)

    data class Poll(val question: String, val options: List<PollOption>, val voters: Int)

    data class Collab(val members: List<Member>, val messages: List<Message>, val poll: Poll?, val path: String)

    /** The labels, translated by the app. The optional ones fall back to English. */
    data class Labels(private val raw: JSONObject) {
        val nextTrip get() = text("nextTrip", "Next trip")
        val today get() = text("today", "Today")
        val noTrip get() = text("noTrip", "No trip coming up. Plan the next one in TREK.")
        val inDays get() = text("inDays", "in {n} days")
        val tomorrow get() = text("tomorrow", "Tomorrow")
        val nothingPlanned get() = text("nothingPlanned", "Nothing planned today")
        val days get() = text("days", "days")
        val bookings get() = text("bookings", "Coming up")
        val noBookings get() = text("noBookings", "No bookings ahead")
        val todos get() = text("todos", "To-dos")
        val noTodos get() = text("noTodos", "All done")
        val packing get() = text("packing", "Packing")
        val packed get() = text("packed", "packed")
        val confirmed get() = text("confirmed", "Confirmed")
        val pending get() = text("pending", "Pending")
        val todayShort get() = text("todayShort", today)
        val tomorrowShort get() = text("tomorrowShort", tomorrow)
        val now get() = text("now", "Now")
        val places get() = text("places", "places")
        val travellers get() = text("travellers", "travellers")
        val allDone get() = text("allDone", "Day done")
        val openTrek get() = text("openTrek", "Open TREK")
        val missing get() = text("missing", "still to pack")
        val countries get() = text("countries", "countries")
        val world get() = text("world", "of the world")
        val group get() = text("group", "Travel group")
        val poll get() = text("poll", "Poll")
        val votes get() = text("votes", "votes")
        val noMessages get() = text("noMessages", "No messages yet")
        val departure get() = text("departure", "Departure")

        private fun text(key: String, fallback: String): String = raw.optString(key).ifBlank { fallback }
    }

    /** Whole days from [now] to the trip's start. */
    fun daysUntilStart(now: LocalDate = LocalDate.now()): Long? = trip?.let { day(it.start) }?.let { ChronoUnit.DAYS.between(now, it) }

    /** The trip's length in days, from its dates when the app sent no count. */
    val tripLength: Int?
        get() {
            trip?.dayCount?.takeIf { it > 0 }?.let { return it }
            val start = trip?.let { day(it.start) } ?: return null
            val end = day(trip.end) ?: return null
            return ChronoUnit.DAYS.between(start, end).toInt() + 1
        }

    companion object {
        fun parse(json: String): WidgetSnapshot? = try {
            fromJson(JSONObject(json))
        } catch (e: Exception) {
            null
        }

        fun fromJson(o: JSONObject): WidgetSnapshot = WidgetSnapshot(
            trip = o.optJSONObject("trip")?.let {
                Trip(
                    title = it.optString("title"),
                    start = it.optString("start"),
                    end = it.optString("end"),
                    path = it.optString("path", "/"),
                    place = it.str("place"),
                    cover = it.str("cover"),
                    dayCount = it.int("dayCount"),
                    placeCount = it.int("placeCount"),
                    memberCount = it.int("memberCount"),
                )
            },
            today = o.optJSONObject("today")?.let { t ->
                Today(
                    dayLabel = t.optString("dayLabel"),
                    stops = t.optJSONArray("stops").objects().map {
                        Stop(it.str("time"), it.optString("name"), it.int("minutes"), it.str("color"), it.str("symbol"))
                    },
                    index = t.int("index"),
                    total = t.int("total"),
                )
            },
            weather = o.optJSONObject("weather")?.let {
                Weather(it.optInt("temp"), it.int("high"), it.int("low"), it.optString("main"), it.optString("label"), it.str("place"), it.int("rain"))
            },
            bookings = o.optJSONArray("bookings").objects().map {
                Booking(
                    title = it.optString("title"),
                    kind = it.optString("kind", "other"),
                    date = it.str("date"),
                    time = it.str("time"),
                    detail = it.str("detail"),
                    confirmed = it.optBoolean("confirmed"),
                    path = it.optString("path", "/"),
                )
            },
            todos = o.optJSONObject("todos")?.let { t ->
                Todos(
                    open = t.optInt("open"),
                    total = t.optInt("total"),
                    items = t.optJSONArray("items").objects().map { Todo(it.optString("name"), it.str("due"), it.optInt("priority")) },
                    path = t.optString("path", "/"),
                )
            },
            packing = o.optJSONObject("packing")?.let { p ->
                Packing(
                    packed = p.optInt("packed"),
                    total = p.optInt("total"),
                    path = p.optString("path", "/"),
                    bags = p.optJSONArray("bags").objects().map {
                        Bag(it.optString("name"), it.optString("color", "#4A7DDB"), it.optInt("grams"), it.int("limit"), it.optInt("packed"), it.optInt("total"))
                    },
                    missing = p.optJSONArray("missing").objects().map { PackItem(it.optString("name"), it.str("category"), it.str("color")) },
                )
            },
            atlas = o.optJSONObject("atlas")?.let { a ->
                Atlas(
                    count = a.optInt("count"),
                    codes = a.optJSONArray("codes").strings(),
                    recent = a.optJSONArray("recent").objects().map { Country(it.optString("code"), it.optString("name")) },
                    continents = a.optJSONArray("continents").objects().map { Continent(it.optString("name"), it.optInt("count")) },
                    trips = a.int("trips"),
                    days = a.int("days"),
                )
            },
            collab = o.optJSONObject("collab")?.let { c ->
                Collab(
                    members = c.optJSONArray("members").objects().map { Member(it.optString("name"), it.optString("initials")) },
                    messages = c.optJSONArray("messages").objects().map {
                        Message(it.optString("author"), it.optString("initials"), it.optString("text"), it.str("at"), it.optBoolean("mine"))
                    },
                    poll = c.optJSONObject("poll")?.let { p ->
                        Poll(p.optString("question"), p.optJSONArray("options").objects().map { PollOption(it.optString("label"), it.optInt("votes")) }, p.optInt("voters"))
                    },
                    path = c.optString("path", "/"),
                )
            },
            labels = Labels(o.optJSONObject("labels") ?: JSONObject()),
        )

        fun day(iso: String?): LocalDate? {
            if (iso.isNullOrBlank() || iso.length < 10) return null
            return try {
                LocalDate.parse(iso.substring(0, 10))
            } catch (e: DateTimeParseException) {
                null
            }
        }

        /** The app link a tap opens: com.liketrek.trek://navigate<path>, which the UI routes (nativeApp.ts). */
        fun link(path: String): String = "com.liketrek.trek://navigate" + if (path.startsWith("/")) path else "/$path"

        private fun JSONObject.str(key: String): String? = if (isNull(key)) null else optString(key).ifEmpty { null }

        private fun JSONObject.int(key: String): Int? = if (has(key) && !isNull(key)) optInt(key) else null

        private fun JSONArray?.objects(): List<JSONObject> =
            if (this == null) emptyList() else (0 until length()).mapNotNull { optJSONObject(it) }

        private fun JSONArray?.strings(): List<String> =
            if (this == null) emptyList() else (0 until length()).mapNotNull { optString(it).ifEmpty { null } }
    }
}

/** A trip a widget can be set to, as the app lists them (key "trips"). */
data class TripRef(val id: Long, val title: String, val start: String, val end: String) {
    companion object {
        fun parseList(json: String?): List<TripRef> {
            if (json.isNullOrBlank()) return emptyList()
            return try {
                val array = JSONArray(json)
                (0 until array.length()).mapNotNull { i ->
                    val o = array.optJSONObject(i) ?: return@mapNotNull null
                    if (!o.has("id")) return@mapNotNull null
                    TripRef(o.optLong("id"), o.optString("title"), o.optString("start"), o.optString("end"))
                }
            } catch (e: Exception) {
                emptyList()
            }
        }
    }
}
