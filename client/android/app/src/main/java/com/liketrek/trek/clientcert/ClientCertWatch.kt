package com.liketrek.trek.clientcert

import android.content.Context
import java.util.concurrent.atomic.AtomicLong

/**
 * Notices when the user's server stops letting the app in for want of a
 * client certificate: one removed, expired, or no longer trusted by the proxy.
 *
 * The page alone does not show it. The service worker serves TREK's start page
 * from its cache, so the page loads and only its requests fail, and the UI
 * reports a server it cannot reach with no way to add a certificate. So when
 * the server asks for one, the app checks once natively whether TREK answers
 * with what it holds. Only a check that fails at the certificate (the handshake
 * broke off, or the proxy answered with its own 4xx) sends the app to the
 * address screen, which says so and offers to add one. A server that merely
 * asks and lets everyone in answers TREK's 200, and nothing happens.
 */
object ClientCertWatch {

    private const val MIN_INTERVAL_MS = 60_000L
    private const val FEATURES_PATH = "/api/health/features"
    private const val TIMEOUT_MS = 8000

    private val lastCheck = AtomicLong(0)

    /** Called where the server asked for a certificate; `onRefused` runs at most once a minute, on a background thread. */
    @JvmStatic
    fun serverAsked(context: Context, serverUrl: String?, onRefused: Runnable) {
        if (serverUrl == null) return
        val now = System.currentTimeMillis()
        val last = lastCheck.get()
        if (now - last < MIN_INTERVAL_MS || !lastCheck.compareAndSet(last, now)) return
        val appContext = context.applicationContext
        Thread({
            val result = ClientCertActions.request(appContext, serverUrl.trimEnd('/') + FEATURES_PATH, TIMEOUT_MS)
            if (refused(result.optBoolean("certRequested"), result.optInt("status"))) onRefused.run()
        }, "trek-client-cert-watch").start()
    }

    /** A new or removed certificate is worth a check of its own, whenever the last one ran. */
    @JvmStatic
    fun reset() {
        lastCheck.set(0)
    }

    /** The server asked for a certificate and did not answer with TREK. */
    @JvmStatic
    fun refused(certRequested: Boolean, status: Int): Boolean = certRequested && (status == 0 || status in 400..499)
}
