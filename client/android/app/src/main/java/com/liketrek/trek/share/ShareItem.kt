package com.liketrek.trek.share

import android.content.ContentResolver
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * What was shared to TREK, read into a file the booking import takes: a wallet
 * pass, a PDF, a mail, a calendar entry, a web page, a piece of text or a photo.
 * The import in the app (BookingImportModal) decides what it can read; this only
 * carries the bytes over with a name and a type, like ShareItem.swift on iOS.
 */
data class ShareItem(
    val kind: Kind,
    /** The file name the import sees. */
    val name: String,
    val mimeType: String,
    val data: ByteArray,
    /** What the sheet shows: a page title, a file name, the first line of a text. */
    val title: String,
    /** A host, for a page. */
    val source: String? = null,
) {
    enum class Kind { PASS, PDF, MAIL, CALENDAR, PAGE, TEXT, IMAGE, FILE }

    override fun equals(other: Any?): Boolean = other is ShareItem && other.name == name && other.data.contentEquals(data)

    override fun hashCode(): Int = name.hashCode() * 31 + data.contentHashCode()
}

class ShareLoadException(val reason: Reason) : Exception(reason.name) {
    enum class Reason { UNSUPPORTED, TOO_LARGE }
}

object ShareLoader {
    /** The same ceiling as the app's import of an opened file (TrekSharedFiles). */
    const val MAX_BYTES = 15 * 1024 * 1024
    private const val PAGE_TIMEOUT_MS = 10_000

    /** Reads what [intent] carries. Runs on a background thread: it may read a file or fetch a page. */
    fun load(intent: Intent, resolver: ContentResolver): ShareItem {
        val stream = streamOf(intent)
        if (stream != null) return fromUri(stream, intent.type, resolver)
        val text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString()?.trim()
        if (!text.isNullOrEmpty()) return fromText(text, intent.getStringExtra(Intent.EXTRA_SUBJECT))
        throw ShareLoadException(ShareLoadException.Reason.UNSUPPORTED)
    }

    private fun streamOf(intent: Intent): Uri? = when (intent.action) {
        Intent.ACTION_VIEW -> intent.data?.takeIf { it.scheme == ContentResolver.SCHEME_CONTENT || it.scheme == ContentResolver.SCHEME_FILE }
        Intent.ACTION_SEND -> parcelable(intent, Intent.EXTRA_STREAM)
        Intent.ACTION_SEND_MULTIPLE -> parcelableList(intent)?.firstOrNull()
        else -> null
    }

    @Suppress("DEPRECATION")
    private fun parcelable(intent: Intent, key: String): Uri? =
        if (Build.VERSION.SDK_INT >= 33) intent.getParcelableExtra(key, Uri::class.java) else intent.getParcelableExtra(key)

    @Suppress("DEPRECATION")
    private fun parcelableList(intent: Intent): List<Uri>? =
        if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM)
        }

    private fun fromUri(uri: Uri, intentType: String?, resolver: ContentResolver): ShareItem {
        val name = displayName(uri, resolver)
        val size = runCatching {
            resolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)?.use { if (it.moveToFirst() && !it.isNull(0)) it.getLong(0) else null }
        }.getOrNull()
        if (size != null && size > MAX_BYTES) throw ShareLoadException(ShareLoadException.Reason.TOO_LARGE)
        val data = resolver.openInputStream(uri)?.use { readCapped(it) } ?: throw ShareLoadException(ShareLoadException.Reason.UNSUPPORTED)
        val mime = resolver.getType(uri) ?: intentType ?: "application/octet-stream"
        val (kind, normalized) = classify(name, mime)
        return checked(ShareItem(kind, withExtension(name, kind), normalized, data, name.substringBeforeLast('.').ifBlank { name }))
    }

    /** A link becomes the page it points at; anything else, a text file the import reads. */
    internal fun fromText(text: String, subject: String?): ShareItem {
        val link = firstLink(text)
        if (link != null) {
            runCatching { return page(link, subject) }
        }
        val firstLine = text.lineSequence().firstOrNull { it.isNotBlank() }?.trim() ?: text
        return checked(ShareItem(ShareItem.Kind.TEXT, "shared-text.txt", "text/plain", text.toByteArray(), (subject ?: firstLine).take(80)))
    }

    /** The first http(s) link in a text, when the text is not much more than that link. */
    internal fun firstLink(text: String): String? {
        val match = Regex("https?://[^\\s<>\"]+").find(text) ?: return null
        // A long mail body with a link in it is the booking itself, not a pointer to one.
        return if (text.length - match.value.length <= 200) match.value.trimEnd('.', ',', ')', ']') else null
    }

    private fun page(link: String, subject: String?): ShareItem {
        val connection = URL(link).openConnection() as HttpURLConnection
        connection.connectTimeout = PAGE_TIMEOUT_MS
        connection.readTimeout = PAGE_TIMEOUT_MS
        connection.instanceFollowRedirects = true
        connection.setRequestProperty("Accept", "text/html")
        try {
            val code = connection.responseCode
            val type = connection.contentType.orEmpty()
            if (code !in 200..299 || !type.contains("html")) throw ShareLoadException(ShareLoadException.Reason.UNSUPPORTED)
            val data = connection.inputStream.use { readCapped(it) }
            val html = String(data, Charsets.UTF_8)
            val host = runCatching { Uri.parse(link).host }.getOrNull()
            val title = pageTitle(html) ?: subject ?: host ?: "Page"
            return checked(ShareItem(ShareItem.Kind.PAGE, "${slug(title)}.html", "text/html", data, title, host))
        } finally {
            connection.disconnect()
        }
    }

    /** The kind and the MIME type the import should see, from the name when the type is vague. */
    internal fun classify(name: String, mime: String): Pair<ShareItem.Kind, String> {
        val ext = name.substringAfterLast('.', "").lowercase()
        return when {
            ext == "pkpass" || mime == "application/vnd.apple.pkpass" -> ShareItem.Kind.PASS to "application/vnd.apple.pkpass"
            ext == "pdf" || mime == "application/pdf" -> ShareItem.Kind.PDF to "application/pdf"
            ext == "eml" || mime == "message/rfc822" -> ShareItem.Kind.MAIL to "message/rfc822"
            ext == "ics" || mime == "text/calendar" -> ShareItem.Kind.CALENDAR to "text/calendar"
            ext == "html" || ext == "htm" || mime == "text/html" -> ShareItem.Kind.PAGE to "text/html"
            mime.startsWith("image/") -> ShareItem.Kind.IMAGE to mime
            ext == "txt" || mime == "text/plain" -> ShareItem.Kind.TEXT to "text/plain"
            else -> ShareItem.Kind.FILE to mime
        }
    }

    private fun withExtension(name: String, kind: ShareItem.Kind): String {
        val ext = when (kind) {
            ShareItem.Kind.PASS -> "pkpass"
            ShareItem.Kind.PDF -> "pdf"
            ShareItem.Kind.MAIL -> "eml"
            ShareItem.Kind.CALENDAR -> "ics"
            ShareItem.Kind.PAGE -> "html"
            else -> return name
        }
        return if (name.lowercase().endsWith(".$ext")) name else "$name.$ext"
    }

    private fun displayName(uri: Uri, resolver: ContentResolver): String {
        runCatching {
            resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
                if (it.moveToFirst() && !it.isNull(0)) return it.getString(0)
            }
        }
        return uri.lastPathSegment?.substringAfterLast('/')?.ifBlank { null } ?: "booking"
    }

    private fun readCapped(input: InputStream): ByteArray {
        val out = ByteArrayOutputStream()
        val buffer = ByteArray(16 * 1024)
        while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            out.write(buffer, 0, read)
            if (out.size() > MAX_BYTES) throw ShareLoadException(ShareLoadException.Reason.TOO_LARGE)
        }
        return out.toByteArray()
    }

    private fun checked(item: ShareItem): ShareItem {
        if (item.data.isEmpty()) throw ShareLoadException(ShareLoadException.Reason.UNSUPPORTED)
        if (item.data.size > MAX_BYTES) throw ShareLoadException(ShareLoadException.Reason.TOO_LARGE)
        return item
    }

    internal fun pageTitle(html: String): String? {
        val match = Regex("<title[^>]*>(.*?)</title>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)).find(html) ?: return null
        return match.groupValues[1].trim().take(120).ifBlank { null }
    }

    internal fun slug(title: String): String {
        val words = title.lowercase().split(Regex("[^\\p{L}\\p{N}]+")).filter { it.isNotEmpty() }
        return words.take(8).joinToString("-").ifBlank { "page" }
    }
}
