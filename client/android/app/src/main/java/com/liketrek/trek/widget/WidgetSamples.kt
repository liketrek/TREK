package com.liketrek.trek.widget

import android.content.Context
import com.liketrek.trek.R
import java.time.LocalDate
import org.json.JSONObject

/**
 * The sample trip the widget picker shows before the app ever wrote a snapshot,
 * and what the screenshot tests draw: the same trip to Kyoto as the iOS gallery
 * (WidgetSnapshot.sample in TrekFamily.swift).
 */
object WidgetSamples {
    fun emptyText(context: Context): String = context.getString(R.string.widget_empty)

    fun snapshot(running: Boolean, now: LocalDate = LocalDate.now()): WidgetSnapshot = WidgetSnapshot.fromJson(JSONObject(json(running, now)))

    fun json(running: Boolean, now: LocalDate = LocalDate.now()): String {
        fun iso(offset: Long) = now.plusDays(offset).toString()
        val start = if (running) -2L else 12L
        val today = if (running) {
            """
            "today": {"dayLabel": "Day 3 of 9", "index": 3, "total": 9, "stops": [
              {"time": "08:30", "name": "Fushimi Inari Taisha", "minutes": 510, "color": "#D6273B", "symbol": "building.columns.fill"},
              {"time": "11:00", "name": "Nishiki Market", "minutes": 660, "color": "#E8A13A", "symbol": "storefront.fill"},
              {"time": "13:30", "name": "Kiyomizu-dera", "minutes": 810, "color": "#2FA37A", "symbol": "leaf.fill"},
              {"time": "16:00", "name": "Gion walk", "minutes": 960, "color": "#4A7DDB", "symbol": "figure.walk"},
              {"time": "19:30", "name": "Dinner at Pontocho", "minutes": 1170, "color": "#8E6CD9", "symbol": "fork.knife"}
            ]},
            """
        } else {
            ""
        }
        return """
        {
          "trip": {"title": "Autumn in Kyoto", "start": "${iso(start)}", "end": "${iso(start + 8)}", "path": "/trips/1",
                   "place": "Kyoto, Japan", "dayCount": 9, "placeCount": 34, "memberCount": 3},
          $today
          "weather": {"temp": 18, "high": 21, "low": 11, "main": "${if (running) "Clear" else "Clouds"}", "label": "Mostly sunny", "place": "Kyoto", "rain": 10},
          "bookings": [
            {"title": "LH 716", "kind": "flight", "date": "${iso(if (running) 6 else 12)}", "time": "13:05", "detail": "FRA → HND", "confirmed": true, "path": "/trips/1"},
            {"title": "Shinkansen Nozomi 21", "kind": "train", "date": "${iso(if (running) 0 else 13)}", "time": "09:12", "detail": "Tokyo → Kyoto", "confirmed": true, "path": "/trips/1"},
            {"title": "Hotel Kanra Kyoto", "kind": "hotel", "date": "${iso(if (running) 0 else 13)}", "time": "15:00", "detail": "6 nights", "confirmed": true, "path": "/trips/1"},
            {"title": "Kaiseki at Kikunoi", "kind": "restaurant", "date": "${iso(if (running) 1 else 15)}", "time": "19:00", "detail": "Higashiyama", "confirmed": false, "path": "/trips/1"},
            {"title": "Tea ceremony", "kind": "event", "date": "${iso(if (running) 2 else 16)}", "time": "10:30", "detail": "Camellia Flower", "confirmed": true, "path": "/trips/1"}
          ],
          "todos": {"open": 4, "total": 11, "path": "/trips/1/todos", "items": [
            {"name": "Order JR Pass", "due": "${iso(if (running) 0 else 3)}", "priority": 3},
            {"name": "Book Ghibli Museum tickets", "due": "${iso(if (running) 1 else 5)}", "priority": 2},
            {"name": "Get yen in cash", "priority": 1},
            {"name": "Download offline maps", "priority": 0}
          ]},
          "packing": {"packed": 23, "total": 31, "path": "/trips/1/packing",
            "bags": [
              {"name": "Suitcase", "color": "#4A7DDB", "grams": 14200, "limit": 23000, "packed": 15, "total": 19},
              {"name": "Daypack", "color": "#2FA37A", "grams": 4100, "limit": 8000, "packed": 8, "total": 12}
            ],
            "missing": [
              {"name": "Rain jacket", "category": "Clothes", "color": "#4A7DDB"},
              {"name": "Power bank", "category": "Tech", "color": "#2FA37A"},
              {"name": "Passport", "category": "Documents", "color": "#2FA37A"},
              {"name": "Sandals", "category": "Shoes", "color": "#4A7DDB"}
            ]},
          "atlas": {"count": 23, "trips": 41, "days": 318,
            "codes": ["DE","AT","CH","FR","IT","ES","PT","NL","BE","DK","NO","SE","GB","IE","GR","HR","JP","TH","VN","US","CA","MA","AU"],
            "recent": [{"code": "JP", "name": "Japan"}, {"code": "NO", "name": "Norway"}, {"code": "PT", "name": "Portugal"}, {"code": "MA", "name": "Morocco"}],
            "continents": [{"name": "Europe", "count": 16}, {"name": "Asia", "count": 3}, {"name": "North America", "count": 2}, {"name": "Africa", "count": 1}, {"name": "Oceania", "count": 1}]},
          "collab": {"path": "/trips/1?tab=collab",
            "members": [{"name": "Maurice", "initials": "MA"}, {"name": "Julien", "initials": "JU"}, {"name": "Elmo", "initials": "EL"}, {"name": "Sara", "initials": "SA"}],
            "messages": [
              {"author": "Julien", "initials": "JU", "text": "Got the JR Pass vouchers, all four of us", "mine": false},
              {"author": "Sara", "initials": "SA", "text": "Can we push dinner to 20:00? Train is late", "mine": false},
              {"author": "Maurice", "initials": "MA", "text": "Sure, I moved the table at Pontocho", "mine": true}
            ],
            "poll": {"question": "Day trip on Saturday?", "voters": 4, "options": [{"label": "Nara", "votes": 3}, {"label": "Uji", "votes": 1}, {"label": "Kurama", "votes": 0}]}},
          "labels": {
            "nextTrip": "Next trip", "today": "Today", "noTrip": "No trip coming up. Plan the next one in TREK.",
            "inDays": "in {n} days", "tomorrow": "Tomorrow", "nothingPlanned": "Nothing planned today",
            "days": "days", "bookings": "Coming up", "noBookings": "No bookings ahead",
            "todos": "To-dos", "noTodos": "All done", "packing": "Packing", "packed": "packed",
            "confirmed": "Confirmed", "pending": "Pending", "todayShort": "Today", "tomorrowShort": "Tomorrow",
            "now": "Now", "places": "places", "travellers": "travellers", "allDone": "Day done",
            "missing": "still to pack", "countries": "countries", "world": "of the world", "group": "Travel group",
            "poll": "Poll", "votes": "votes", "noMessages": "No messages yet", "departure": "Departure"
          }
        }
        """.trimIndent()
    }
}
