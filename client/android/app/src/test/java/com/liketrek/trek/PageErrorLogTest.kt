package com.liketrek.trek

import org.junit.Assert.assertEquals
import org.junit.Test

/** The log line for a page that came back with an error status (#3014). */
class PageErrorLogTest {

    @Test
    fun namesThePageItsStatusAndWhoAnswered() {
        val line = PageErrorLog.describe(
            "https://trek.example.com/login?redirect=%2F#top",
            503,
            "Service Unavailable",
            mapOf(
                "server" to "cloudflare",
                "CF-RAY" to "8f1a2b3c4d5e6f70-FRA",
                "content-type" to "text/html; charset=UTF-8",
                "Set-Cookie" to "session=secret",
            ),
        )

        // Any case of a header name is read, only the naming headers are logged,
        // and the query with its sign-in state is left off.
        assertEquals(
            "Page answered HTTP 503 Service Unavailable for https://trek.example.com/login " +
                "(server: cloudflare, cf-ray: 8f1a2b3c4d5e6f70-FRA, content-type: text/html; charset=UTF-8)",
            line,
        )
    }

    @Test
    fun anAnswerWithoutHeadersSaysSo() {
        assertEquals(
            "Page answered HTTP 503 for https://trek.example.com/ (no server headers)",
            PageErrorLog.describe("https://trek.example.com/", 503, null, emptyMap()),
        )
        assertEquals(
            "Page answered HTTP 502 Bad Gateway for  (no server headers)",
            PageErrorLog.describe(null, 502, "Bad Gateway", null),
        )
    }

    @Test
    fun aFragmentBeforeAQuestionMarkEndsTheAddressThere() {
        assertEquals(
            "Page answered HTTP 500 for https://trek.example.com/trips/4 (via: 1.1 proxy)",
            PageErrorLog.describe("https://trek.example.com/trips/4#a?b", 500, " ", mapOf("Via" to "1.1 proxy")),
        )
    }
}
