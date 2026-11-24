package com.liketrek.trek.clientcert

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.net.Uri
import android.text.InputType
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import com.getcapacitor.JSObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * What TrekShellPlugin does for client certificates (TrekClientIdentity):
 * check a server while noticing whether it asks for one, read a picked file,
 * and ask for its password.
 */
object ClientCertActions {

    private const val MAX_BODY_BYTES = 512 * 1024
    private const val MAX_FILE_BYTES = 256 * 1024
    private const val MAX_REDIRECTS = 5

    /**
     * A GET against the user's server for the address screen: status, body, final
     * URL and headers, plus whether the server asked for a client certificate and
     * whether one was shown. A failed connection answers status 0 instead of
     * throwing, so a handshake the server broke off for want of a certificate
     * still reports that it asked.
     */
    @JvmStatic
    fun request(context: Context, url: String, timeoutMs: Int): JSObject {
        var asked: Triple<String, Int, Boolean>? = null
        val factory = TrekClientIdentity.socketFactory(context) { host, port, served -> asked = Triple(host, port, served) }
        val result = JSObject()
        var current = URL(url)
        try {
            for (hop in 0..MAX_REDIRECTS) {
                val connection = current.openConnection() as HttpURLConnection
                if (connection is HttpsURLConnection) connection.sslSocketFactory = factory
                connection.instanceFollowRedirects = false
                connection.connectTimeout = timeoutMs
                connection.readTimeout = timeoutMs
                connection.setRequestProperty("Accept", "application/json, text/html;q=0.9, */*;q=0.8")
                try {
                    val status = connection.responseCode
                    val location = connection.getHeaderField("Location")
                    if (status in 300..399 && location != null && hop < MAX_REDIRECTS) {
                        current = URL(current, location)
                        continue
                    }
                    val stream = if (status >= 400) connection.errorStream else connection.inputStream
                    result.put("status", status)
                    result.put("data", stream?.use { readCapped(it, MAX_BODY_BYTES) }?.toString(Charsets.UTF_8) ?: "")
                    result.put("url", current.toString())
                    val headers = JSObject()
                    for ((name, values) in connection.headerFields) if (name != null && values.isNotEmpty()) headers.put(name, values.first())
                    result.put("headers", headers)
                } finally {
                    connection.disconnect()
                }
                break
            }
        } catch (e: IOException) {
            result.put("status", 0)
            result.put("data", "")
            result.put("url", current.toString())
            result.put("error", e.javaClass.simpleName)
        }
        val seen = asked
        result.put("certRequested", seen != null)
        result.put("certSent", seen?.third == true)
        if (seen != null) result.put("certHost", "${seen.first}:${seen.second}")
        return result
    }

    /** The bytes of a picked file, or null when it cannot be read or is far too big for a certificate. */
    @JvmStatic
    fun readFile(context: Context, uri: Uri): ByteArray? = try {
        context.contentResolver.openInputStream(uri)?.use { readCapped(it, MAX_FILE_BYTES + 1) }?.takeIf { it.size <= MAX_FILE_BYTES }
    } catch (e: Exception) {
        null
    }

    /**
     * The password prompt, with the UI's own words (`labels`: title, message,
     * placeholder, ok, cancel, wrongPassword). `wrong` shows that the last try
     * did not open the file. `done` gets the password, or null when cancelled.
     */
    @JvmStatic
    fun askPassword(activity: Activity, labels: JSObject, wrong: Boolean, done: (CharArray?) -> Unit) {
        activity.runOnUiThread {
            val input = EditText(activity).apply {
                inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                hint = labels.getString("placeholder") ?: ""
            }
            val frame = FrameLayout(activity).apply {
                val pad = (20 * activity.resources.displayMetrics.density).toInt()
                setPadding(pad, pad / 2, pad, 0)
                addView(input, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            }
            val message = if (wrong) labels.getString("wrongPassword") else labels.getString("message")
            var answered = false
            val dialog = AlertDialog.Builder(activity)
                .setTitle(labels.getString("title"))
                .setMessage(message)
                .setView(frame)
                .setPositiveButton(labels.getString("ok") ?: "OK") { _, _ ->
                    answered = true
                    val text = input.text
                    val password = CharArray(text.length) { text[it] }
                    done(password)
                }
                .setNegativeButton(labels.getString("cancel") ?: "Cancel") { _, _ ->
                    answered = true
                    done(null)
                }
                .setOnDismissListener { if (!answered) done(null) }
                .create()
            dialog.show()
            input.requestFocus()
        }
    }

    /** The settings' view of the stored certificate. */
    @JvmStatic
    fun infoObject(info: TrekClientIdentity.Info): JSObject = JSObject().apply {
        put("host", info.host)
        put("port", info.port)
        put("subject", info.subject)
        put("issuer", info.issuer)
        put("notAfter", info.notAfter)
    }

    private fun readCapped(stream: InputStream, max: Int): ByteArray {
        val out = ByteArrayOutputStream()
        val buffer = ByteArray(8192)
        while (out.size() < max) {
            val n = stream.read(buffer, 0, minOf(buffer.size, max - out.size()))
            if (n < 0) break
            out.write(buffer, 0, n)
        }
        return out.toByteArray()
    }
}
