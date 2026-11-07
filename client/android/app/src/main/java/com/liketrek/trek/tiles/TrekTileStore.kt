package com.liketrek.trek.tiles

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * The app's own store of Mapbox map resources, the counterpart of the iOS
 * TrekTileStore (TrekBridgeViewController.swift).
 *
 * Android's WebView runs the server's service worker, which keeps every raster
 * tile the user looked at. Mapbox's vector tiles, styles, sprites and glyphs it
 * may not keep, but a device cache of what was viewed is allowed for 30 days,
 * so the WebView client hands those requests here (TrekWebViewClient), and a
 * Mapbox map keeps working offline for the places already seen. Nothing is
 * prefetched; the store is pruned to [MAX_BYTES], least recently used first.
 */
object TrekTileStore {
    const val MAX_AGE_MS = 30L * 24 * 60 * 60 * 1000
    const val MAX_BYTES = 250L * 1024 * 1024
    private const val PRUNE_TARGET = 0.8
    private const val TIMEOUT_MS = 15_000
    /** One resource is a tile, a style or a sprite sheet: far below this. */
    private const val MAX_RESOURCE_BYTES = 8 * 1024 * 1024

    private val HOST = Regex("^(api\\.mapbox\\.com|[a-z0-9-]+\\.tiles\\.mapbox\\.com)$", RegexOption.IGNORE_CASE)
    /** What a map draws; telemetry, sessions and anything else go straight out. */
    private val PATHS = listOf("/v4/", "/styles/", "/fonts/", "/models/", "/rasterarrays/", "/raster/")
    private val DROPPED = setOf("access_token", "sku", "key", "api_key", "apikey")

    @Volatile private var dir: File? = null
    private var writesSincePrune = 0

    fun init(context: Context) {
        if (dir == null) dir = File(context.cacheDir, "tiles").apply { mkdirs() }
    }

    fun handles(request: WebResourceRequest): Boolean = request.method == "GET" && handles(request.url)

    fun handles(url: Uri): Boolean = url.scheme == "https" && HOST.matches(url.host.orEmpty()) && PATHS.any { url.path.orEmpty().startsWith(it) }

    /** The key of a resource: its URL without the credentials and the billing session, which change. */
    fun key(url: Uri): String {
        val builder = url.buildUpon().clearQuery()
        url.queryParameterNames.filter { it.lowercase() !in DROPPED }.sorted().forEach { name ->
            url.getQueryParameters(name).forEach { builder.appendQueryParameter(name, it) }
        }
        val digest = MessageDigest.getInstance("SHA-256").digest(builder.build().toString().toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    /**
     * Answers a Mapbox request from the store when it is younger than 30 days,
     * else from the network, keeping what came back. Null lets the WebView load
     * it itself (no store, or the network failed).
     */
    fun serve(request: WebResourceRequest): WebResourceResponse? {
        val root = dir ?: return null
        val url = request.url
        val key = key(url)
        val body = File(root, "$key.bin")
        val meta = File(root, "$key.type")
        val now = System.currentTimeMillis()
        if (body.exists() && now - created(meta) < MAX_AGE_MS) {
            body.setLastModified(now)
            val type = runCatching { meta.readLines().getOrNull(1) }.getOrNull() ?: "application/octet-stream"
            return runCatching { response(body.readBytes(), type) }.getOrNull()
        }
        try {
            val connection = URL(url.toString()).openConnection() as HttpURLConnection
            connection.connectTimeout = TIMEOUT_MS
            connection.readTimeout = TIMEOUT_MS
            // The WebView's own headers go along: Mapbox checks a URL-restricted token
            // against the Referer, and the server's origin is what the token allows.
            for ((name, value) in forwardedHeaders(request.requestHeaders)) connection.setRequestProperty(name, value)
            try {
                val code = connection.responseCode
                if (code == 200) {
                    val bytes = connection.inputStream.use { it.readBytes() }
                    if (bytes.size <= MAX_RESOURCE_BYTES) {
                        val type = connection.contentType ?: "application/octet-stream"
                        store(body, meta, bytes, type, now)
                        return response(bytes, type)
                    }
                }
                // Anything but a tile (401/403 for a token, 404, a 5xx) the WebView asks for
                // itself, with everything a browser sends, and the map reports what it gets.
            } finally {
                connection.disconnect()
            }
        } catch (e: Exception) {
            // Offline and never seen: the map shows the gap as it would in a browser.
        }
        return null
    }

    /** HttpURLConnection has already undone any gzip, so no Content-Encoding goes along. */
    /** Headers that are the request's own; the connection sets the hop-by-hop ones itself. */
    private val HOP_BY_HOP = setOf("connection", "keep-alive", "transfer-encoding", "te", "upgrade", "host", "content-length", "accept-encoding")

    internal fun forwardedHeaders(headers: Map<String, String>?): Map<String, String> =
        headers.orEmpty().filterKeys { it.lowercase() !in HOP_BY_HOP }

    private fun response(bytes: ByteArray, type: String): WebResourceResponse {
        val mime = type.substringBefore(';').trim()
        val charset = Regex("charset=([^;]+)").find(type)?.groupValues?.get(1)
        return WebResourceResponse(mime, charset, 200, "OK", cors(), ByteArrayInputStream(bytes))
    }

    /** The map fetches from the server's origin; the store's answer has to allow it as Mapbox's own does. */
    private fun cors(): MutableMap<String, String> = mutableMapOf("Access-Control-Allow-Origin" to "*", "Cache-Control" to "no-store")

    private fun created(meta: File): Long = runCatching { meta.readLines().first().toLong() }.getOrDefault(0L)

    @Synchronized
    private fun store(body: File, meta: File, bytes: ByteArray, type: String, now: Long) {
        runCatching {
            body.writeBytes(bytes)
            meta.writeText("$now\n$type")
        }
        if (++writesSincePrune >= 200) {
            writesSincePrune = 0
            prune()
        }
    }

    /** Drops what is past 30 days, then the least recently used while the store is over its limit. */
    @Synchronized
    fun prune() {
        val root = dir ?: return
        val now = System.currentTimeMillis()
        val bodies = root.listFiles { f -> f.name.endsWith(".bin") }?.toMutableList() ?: return
        bodies.filter { now - created(File(root, it.name.removeSuffix(".bin") + ".type")) > MAX_AGE_MS }.forEach {
            remove(root, it)
            bodies.remove(it)
        }
        var total = bodies.sumOf { it.length() }
        if (total <= MAX_BYTES) return
        val target = (MAX_BYTES * PRUNE_TARGET).toLong()
        for (file in bodies.sortedBy { it.lastModified() }) {
            if (total <= target) break
            total -= file.length()
            remove(root, file)
        }
    }

    private fun remove(root: File, body: File) {
        body.delete()
        File(root, body.name.removeSuffix(".bin") + ".type").delete()
    }

    fun usage(): Long = dir?.listFiles()?.sumOf { it.length() } ?: 0L

    @Synchronized
    fun clear() {
        dir?.listFiles()?.forEach { it.delete() }
    }
}
