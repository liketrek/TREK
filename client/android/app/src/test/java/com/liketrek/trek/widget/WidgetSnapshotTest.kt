package com.liketrek.trek.widget

import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetSnapshotTest {
    private val today = LocalDate.of(2026, 11, 7)

    @Test
    fun readsTheSampleTheIosWidgetsReadToo() {
        val snapshot = WidgetSnapshot.parse(WidgetSamples.json(running = true, now = today))!!
        assertEquals("Autumn in Kyoto", snapshot.trip!!.title)
        assertEquals("/trips/1", snapshot.trip!!.path)
        assertEquals(5, snapshot.today!!.stops.size)
        assertEquals(810, snapshot.today!!.stops[2].minutes)
        assertEquals("leaf.fill", snapshot.today!!.stops[2].symbol)
        assertEquals(5, snapshot.bookings.size)
        assertTrue(snapshot.bookings[0].confirmed)
        assertEquals(2, snapshot.packing!!.bags.size)
        assertEquals(23000, snapshot.packing!!.bags[0].limit)
        assertEquals(23, snapshot.atlas!!.count)
        assertEquals("Nara", snapshot.collab!!.poll!!.options[0].label)
        assertTrue(snapshot.collab!!.messages.last().mine)
    }

    @Test
    fun everythingPastTripTodayAndLabelsIsOptional() {
        val snapshot = WidgetSnapshot.parse("""{"trip":null,"today":null,"labels":{"nextTrip":"Nächste Reise"}}""")!!
        assertNull(snapshot.trip)
        assertNull(snapshot.weather)
        assertTrue(snapshot.bookings.isEmpty())
        assertEquals("Nächste Reise", snapshot.labels.nextTrip)
        // A label the server's UI does not send yet falls back to English.
        assertEquals("Travel group", snapshot.labels.group)
        assertEquals("Today", snapshot.labels.todayShort)
    }

    @Test
    fun brokenJsonIsNoSnapshot() {
        assertNull(WidgetSnapshot.parse("{"))
        assertNull(WidgetSnapshot.parse(""))
    }

    @Test
    fun countsTheDaysToTheTripAndItsLength() {
        val snapshot = WidgetSnapshot.parse(WidgetSamples.json(running = false, now = today))!!
        assertEquals(12L, snapshot.daysUntilStart(today))
        assertEquals(9, snapshot.tripLength)
        val noCount = WidgetSnapshot.parse("""{"trip":{"title":"T","start":"2026-11-10","end":"2026-11-12","path":"/trips/2"},"labels":{}}""")!!
        assertEquals(3, noCount.tripLength)
    }

    @Test
    fun aTapOpensThePathInTheApp() {
        assertEquals("com.liketrek.trek://navigate/trips/1", WidgetSnapshot.link("/trips/1"))
        assertEquals("com.liketrek.trek://navigate/atlas", WidgetSnapshot.link("atlas"))
    }

    @Test
    fun readsTheTripListAndSkipsWhatIsNotATrip() {
        val trips = TripRef.parseList("""[{"id":1,"title":"A","start":"2026-11-01","end":"2026-11-03"},{"title":"no id"},3]""")
        assertEquals(1, trips.size)
        assertEquals(1L, trips[0].id)
        assertTrue(TripRef.parseList("not json").isEmpty())
        assertTrue(TripRef.parseList(null).isEmpty())
    }

    @Test
    fun keysAreTheOnesTheUiWrites() {
        assertTrue(WidgetStore.isValidKey("snapshot"))
        assertTrue(WidgetStore.isValidKey("trips"))
        assertTrue(WidgetStore.isValidKey("trip.42"))
        assertFalse(WidgetStore.isValidKey("trip.../x"))
        assertFalse(WidgetStore.isValidKey("../snapshot"))
        assertFalse(WidgetStore.isValidKey("trip.1234567890123"))
    }

    @Test
    fun theWorldGridHasItsShape() {
        assertEquals(34, WorldGrid.ROWS.size)
        WorldGrid.ROWS.forEach { assertEquals(WorldGrid.COLUMNS * 2, it.length) }
        assertNotNull((0 until 34).flatMap { r -> (0 until WorldGrid.COLUMNS).mapNotNull { WorldGrid.code(r, it) } }.firstOrNull { it == "JP" })
    }

    @Test
    fun aTripKeepsItsColoursAcrossLaunches() {
        assertEquals(WidgetArt.seed("Autumn in Kyoto"), WidgetArt.seed("Autumn in Kyoto"))
        assertFalse(WidgetArt.seed("Lisbon") == WidgetArt.seed("Kyoto"))
    }

    @Test
    fun bookingKindsHaveTheirSymbol() {
        assertEquals("airplane", TrekIcons.booking("flight").first)
        assertEquals("ferry.fill", TrekIcons.booking("cruise").first)
        assertEquals("bookmark.fill", TrekIcons.booking("something").first)
    }

    @Test
    fun turnsToTheDayOfTheDateItIsReadOn() {
        val json = """{"trip":{"title":"T","start":"2026-11-06","end":"2026-11-08","path":"/trips/1"},
            "today":{"date":"2026-11-06","dayLabel":"Day 1 of 3","stops":[{"time":"09:00","name":"Museum","minutes":540}]},
            "days":[
              {"date":"2026-11-06","dayLabel":"Day 1 of 3","stops":[{"time":"09:00","name":"Museum","minutes":540}]},
              {"date":"2026-11-07","dayLabel":"Day 2 of 3","stops":[{"time":"10:00","name":"Harbour","minutes":600}]}
            ],
            "bookings":[
              {"title":"Hotel","kind":"hotel","date":"2026-11-06","confirmed":true,"path":"/trips/1"},
              {"title":"Train","kind":"train","date":"2026-11-07","confirmed":true,"path":"/trips/1"}
            ],
            "labels":{}}"""
        val snapshot = WidgetSnapshot.parse(json)!!
        assertEquals("Day 1 of 3", snapshot.on(LocalDate.of(2026, 11, 6)).today!!.dayLabel)
        val second = snapshot.on(LocalDate.of(2026, 11, 7))
        assertEquals("Day 2 of 3", second.today!!.dayLabel)
        assertEquals("Harbour", second.today!!.stops.single().name)
        assertEquals(listOf("Train"), second.bookings.map { it.title })
        // A day the app wrote nothing for (the trip is over) shows no day.
        assertNull(snapshot.on(LocalDate.of(2026, 11, 9)).today)
    }

    @Test
    fun keepsEveryStopOfTheDayItWasWrittenOn() {
        val json = """{"trip":{"title":"T","start":"2026-11-06","end":"2026-11-07","path":"/trips/1"},
            "today":{"date":"2026-11-06","dayLabel":"Day 1 of 2","stops":[
              {"time":"09:00","name":"Museum","minutes":540},{"time":"21:00","name":"Concert","minutes":1260}]},
            "days":[
              {"date":"2026-11-06","dayLabel":"Day 1 of 2","stops":[{"time":"09:00","name":"Museum","minutes":540}]},
              {"date":"2026-11-07","dayLabel":"Day 2 of 2","stops":[{"time":"10:00","name":"Harbour","minutes":600}]}
            ],
            "labels":{}}"""
        val snapshot = WidgetSnapshot.parse(json)!!
        assertEquals(listOf("Museum", "Concert"), snapshot.on(LocalDate.of(2026, 11, 6)).today!!.stops.map { it.name })
        assertEquals("Day 2 of 2", snapshot.on(LocalDate.of(2026, 11, 7)).today!!.dayLabel)
    }

    @Test
    fun aSnapshotWithoutDaysReadsAsWritten() {
        val snapshot = WidgetSnapshot.parse(WidgetSamples.json(running = true, now = today))!!
        assertTrue(snapshot.days.isEmpty())
        assertEquals(snapshot, snapshot.on(today.plusDays(3)))
    }
}
