package com.liketrek.trek

import android.view.KeyEvent
import com.android.billingclient.api.Purchase
import com.liketrek.trek.billing.TrekBilling
import com.liketrek.trek.screen.TrekKeyCommands
import com.liketrek.trek.screen.TrekWindowLayout
import com.liketrek.trek.share.ShareHandoff
import com.liketrek.trek.share.ShareItem
import com.liketrek.trek.share.ShareLoader
import com.liketrek.trek.tiles.TrekTileStore
import java.time.LocalDate
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** The native side's own decisions, apart from the views. */
class NativeLogicTest {
    @Test
    fun pushesLandInTheChannelOfTheirEvent() {
        assertEquals(TrekPushService.CHANNEL_CHAT, TrekPushService.channelFor("collab_message"))
        assertEquals(TrekPushService.CHANNEL_TRIPS, TrekPushService.channelFor("booking_change"))
        assertEquals(TrekPushService.CHANNEL_TRIPS, TrekPushService.channelFor("todo_due"))
        assertEquals(TrekPushService.CHANNEL_INVITES, TrekPushService.channelFor("trip_invite"))
        assertEquals(TrekPushService.CHANNEL, TrekPushService.channelFor("version_available"))
        // A server too old to name the event: the general channel.
        assertEquals(TrekPushService.CHANNEL, TrekPushService.channelFor(null))
    }

    @Test
    fun sharedFilesAreSortedByWhatTheyAre() {
        assertEquals(ShareItem.Kind.PASS to "application/vnd.apple.pkpass", ShareLoader.classify("Boarding.pkpass", "application/octet-stream"))
        assertEquals(ShareItem.Kind.PDF to "application/pdf", ShareLoader.classify("ticket", "application/pdf"))
        assertEquals(ShareItem.Kind.MAIL to "message/rfc822", ShareLoader.classify("Booking.eml", "application/octet-stream"))
        assertEquals(ShareItem.Kind.CALENDAR to "text/calendar", ShareLoader.classify("invite.ics", ""))
        assertEquals(ShareItem.Kind.IMAGE to "image/png", ShareLoader.classify("shot.png", "image/png"))
        assertEquals(ShareItem.Kind.FILE to "application/zip", ShareLoader.classify("a.zip", "application/zip"))
    }

    @Test
    fun aSharedLinkIsFetchedOnlyWhenTheTextIsLittleMore() {
        assertEquals("https://example.com/booking/1", ShareLoader.firstLink("Your booking: https://example.com/booking/1."))
        assertNull(ShareLoader.firstLink("no link here"))
        assertNull(ShareLoader.firstLink("x".repeat(400) + " https://example.com/a"))
        assertEquals("Hotel Kanra", ShareLoader.pageTitle("<html><head><TITLE> Hotel Kanra </TITLE></head></html>"))
        assertEquals("hotel-kanra-kyoto", ShareLoader.slug("Hotel Kanra, Kyoto!"))
        assertEquals("page", ShareLoader.slug("!!!"))
    }

    @Test
    fun theShareSheetOffersComingTripsFirstThenRecentPastOnes() {
        val today = LocalDate.of(2026, 11, 7)
        fun trip(id: Long, start: String, end: String) =
            ShareHandoff.Trip(id, "T$id", LocalDate.parse(start), LocalDate.parse(end), null, null)
        val past = (1L..8L).map { trip(100 + it, "2026-0$it-01", "2026-0$it-05") }
        val ordered = ShareHandoff.order(
            listOf(trip(1, "2026-12-01", "2026-12-05"), trip(2, "2026-11-05", "2026-11-09")) + past,
            today,
        )
        assertEquals(listOf(2L, 1L), ordered.take(2).map { it.id })
        assertEquals(8, ordered.size)
        assertEquals(108L, ordered[2].id)
    }

    @Test
    fun keyCommandsFollowTheUi() {
        TrekKeyCommands.set(
            JSONArray(
                """[{"id":"search","title":"Search","input":"k","modifiers":["command"]},
                   {"id":"back","title":"Back","input":"[","modifiers":["command"]},
                   {"id":"close","title":"Close","input":"escape","modifiers":[]},
                   {"title":"no id","input":"x"}]""",
            ),
        )
        assertEquals(3, TrekKeyCommands.current.size)
        assertEquals("search", TrekKeyCommands.match(KeyEvent.KEYCODE_K, KeyEvent.META_CTRL_ON)?.id)
        // A Mac keyboard's Command key is Meta here, and counts as Ctrl.
        assertEquals("search", TrekKeyCommands.match(KeyEvent.KEYCODE_K, KeyEvent.META_META_ON)?.id)
        assertNull(TrekKeyCommands.match(KeyEvent.KEYCODE_K, 0))
        assertNull(TrekKeyCommands.match(KeyEvent.KEYCODE_K, KeyEvent.META_CTRL_ON or KeyEvent.META_SHIFT_ON))
        assertEquals("back", TrekKeyCommands.match(KeyEvent.KEYCODE_LEFT_BRACKET, KeyEvent.META_CTRL_ON)?.id)
        assertEquals("close", TrekKeyCommands.match(KeyEvent.KEYCODE_ESCAPE, 0)?.id)
        TrekKeyCommands.set(null)
        assertEquals(0, TrekKeyCommands.current.size)
    }

    @Test
    fun windowSizeClassesUseAndroidsBreakpoints() {
        assertEquals("compact", TrekWindowLayout.sizeClass(411f, 600f, 840f))
        assertEquals("medium", TrekWindowLayout.sizeClass(673f, 600f, 840f))
        assertEquals("expanded", TrekWindowLayout.sizeClass(1280f, 600f, 840f))
    }

    @Test
    fun aRestoreTakesTheNewestActiveCloudSubscription() {
        fun purchase(product: String, time: Long, state: Int) = Purchase(
            JSONObject()
                .put("productIds", JSONArray().put(product))
                .put("purchaseTime", time)
                .put("purchaseState", state)
                .put("purchaseToken", "token-$product-$time")
                .toString(),
            "sig",
        )
        val found = TrekBilling.newest(
            listOf(
                purchase("cloud.start.monthly", 1000, 0),
                purchase("cloud.plus.yearly", 2000, 0),
                purchase("cloud.pro.yearly", 3000, 4),
                purchase("other.thing", 4000, 0),
            ),
            "cloud.",
        )
        assertEquals("token-cloud.plus.yearly-2000", found?.purchaseToken)
        assertNull(TrekBilling.newest(emptyList(), "cloud."))
    }

    @Test
    fun mapboxRequestsKeepTheWebViewsHeaders() {
        val forwarded = TrekTileStore.forwardedHeaders(
            mapOf(
                "Referer" to "https://trek.example.com/",
                "Origin" to "https://trek.example.com",
                "User-Agent" to "Mozilla/5.0 (Linux; Android 16; wv)",
                "Accept" to "application/x-protobuf",
                "Accept-Encoding" to "gzip",
                "Connection" to "keep-alive",
                "Host" to "api.mapbox.com",
            ),
        )
        // A URL-restricted token is checked against the Referer, so it has to go along.
        assertEquals("https://trek.example.com/", forwarded["Referer"])
        assertEquals("https://trek.example.com", forwarded["Origin"])
        assertEquals("Mozilla/5.0 (Linux; Android 16; wv)", forwarded["User-Agent"])
        assertEquals("application/x-protobuf", forwarded["Accept"])
        assertNull(forwarded["Accept-Encoding"])
        assertNull(forwarded["Connection"])
        assertNull(forwarded["Host"])
        assertEquals(emptyMap<String, String>(), TrekTileStore.forwardedHeaders(null))
    }

    @Test
    fun aPaymentThatClearedLaterIsTheUndeliveredOne() {
        fun purchase(product: String, time: Long, acknowledged: Boolean) = Purchase(
            JSONObject()
                .put("productIds", JSONArray().put(product))
                .put("purchaseTime", time)
                .put("purchaseState", 0)
                .put("acknowledged", acknowledged)
                .put("purchaseToken", "token-$time")
                .toString(),
            "sig",
        )
        val renewed = purchase("cloud.plus.yearly", 3000, acknowledged = true)
        val cleared = purchase("cloud.start.monthly", 2000, acknowledged = false)
        assertEquals("token-2000", TrekBilling.undelivered(listOf(renewed, cleared), "cloud.")?.purchaseToken)
        assertNull(TrekBilling.undelivered(listOf(renewed), "cloud."))
    }
}
