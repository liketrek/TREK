package com.liketrek.trek.clientcert

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.io.ByteArrayInputStream
import java.io.IOException
import java.net.Socket
import java.security.KeyFactory
import java.security.KeyStore
import java.security.Principal
import java.security.PrivateKey
import java.security.UnrecoverableKeyException
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.PKCS8EncodedKeySpec
import java.util.Date
import java.util.Locale
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLEngine
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.X509ExtendedKeyManager

/**
 * The client certificate a user's TREK server asks for (mutual TLS): a proxy
 * such as Cloudflare, nginx, Caddy or Traefik in front of TREK lets through only
 * devices that show one. The app holds at most one, for one server.
 *
 * It comes in as a PKCS#12 file (.p12, .pfx) and its password. Neither is kept:
 * the private key is sealed with an AES key of the Android keystore, which
 * never leaves it, and stored with the certificate chain in the app's private
 * preferences. In memory the key is an ordinary one, which TLS 1.2 and 1.3 and
 * the WebView all take, whatever its kind; a key imported into the keystore
 * itself would be refused by some of them for its padding or digest rules.
 *
 * Only the host and port it was imported for ever see it (`identityFor`), so a
 * login page, a map tile provider or liketrek.com never learns of it.
 */
object TrekClientIdentity {

    private const val PREFS = "trek_client_identity"
    private const val WRAP_ALIAS = "trek-client-identity-wrap"
    private const val KEYMANAGER_ALIAS = "trek-client-identity"
    private const val GCM_TAG_BITS = 128

    /** Why a file could not be taken. */
    enum class Failure { PASSWORD, FORMAT, NO_KEY, EXPIRED, NOT_YET_VALID }

    class ImportException(val reason: Failure) : Exception(reason.name)

    class Identity(val key: PrivateKey, val chain: Array<X509Certificate>)

    /** What the settings show: who the certificate names, who issued it, until when, and for which server. */
    data class Info(val host: String, val port: Int, val subject: String, val issuer: String, val notAfter: Long)

    /** The opened identity, with the sealed key text it was opened from: opened once, not per request. */
    @Volatile private var cached: Pair<String, Identity>? = null

    /** The last time a server asked for a certificate while the app showed it: for the address screen. */
    @Volatile var lastRequest: Request? = null
        private set

    data class Request(val host: String, val port: Int, val served: Boolean)

    private class Stored(val host: String, val port: Int, val algorithm: String, val sealedText: String, val iv: ByteArray, val chain: List<ByteArray>)

    /**
     * Reads a PKCS#12 file: the first entry that holds a private key, with its chain.
     * Throws ImportException naming what is wrong with it.
     */
    @JvmStatic
    @JvmOverloads
    @Throws(ImportException::class)
    fun read(bytes: ByteArray, password: CharArray, now: Date = Date()): Identity {
        val store = KeyStore.getInstance("PKCS12")
        try {
            store.load(ByteArrayInputStream(bytes), password)
        } catch (e: IOException) {
            throw ImportException(if (isPasswordFailure(e)) Failure.PASSWORD else Failure.FORMAT)
        } catch (e: Exception) {
            throw ImportException(Failure.FORMAT)
        }
        val alias = store.aliases().toList().firstOrNull { store.isKeyEntry(it) } ?: throw ImportException(Failure.NO_KEY)
        val key = try {
            store.getKey(alias, password) as? PrivateKey
        } catch (e: UnrecoverableKeyException) {
            throw ImportException(Failure.PASSWORD)
        } ?: throw ImportException(Failure.NO_KEY)
        val chain = store.getCertificateChain(alias)?.mapNotNull { it as? X509Certificate }?.toTypedArray()
        if (chain.isNullOrEmpty()) throw ImportException(Failure.NO_KEY)
        val leaf = chain[0]
        if (now.after(leaf.notAfter)) throw ImportException(Failure.EXPIRED)
        if (now.before(leaf.notBefore)) throw ImportException(Failure.NOT_YET_VALID)
        return Identity(key, chain)
    }

    /** A wrong password shows up as a failed MAC check or an unrecoverable key, wrapped in an IOException. */
    private fun isPasswordFailure(e: Throwable): Boolean {
        var cause: Throwable? = e
        while (cause != null) {
            if (cause is UnrecoverableKeyException || cause is javax.crypto.BadPaddingException) return true
            if (cause.message?.lowercase(Locale.ROOT)?.contains("password") == true) return true
            cause = cause.cause
        }
        return false
    }

    /** Keeps the identity for this host and port, replacing any other. */
    @JvmStatic
    fun save(context: Context, identity: Identity, host: String, port: Int) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, wrapKey())
        val sealed = cipher.doFinal(identity.key.encoded)
        prefs(context).edit()
            .putString("host", host.lowercase(Locale.ROOT))
            .putInt("port", port)
            .putString("algorithm", identity.key.algorithm)
            .putString("key", encode(sealed))
            .putString("iv", encode(cipher.iv))
            .putString("chain", identity.chain.joinToString(",") { encode(it.encoded) })
            .apply()
        cached = null
    }

    @JvmStatic
    fun remove(context: Context) {
        prefs(context).edit().clear().apply()
        cached = null
    }

    @JvmStatic
    fun info(context: Context): Info? {
        val stored = stored(context) ?: return null
        val leaf = runCatching { certificate(stored.chain.first()) }.getOrNull() ?: return null
        return Info(stored.host, stored.port, commonName(leaf.subjectX500Principal), commonName(leaf.issuerX500Principal), leaf.notAfter.time)
    }

    /** The identity for a server at this host and port, or null when there is none for it. */
    @JvmStatic
    fun identityFor(context: Context, host: String?, port: Int): Identity? {
        val stored = stored(context) ?: return null
        if (!matches(stored.host, stored.port, host, port)) return null
        return opened(stored)
    }

    private fun opened(stored: Stored): Identity? {
        cached?.let { (from, identity) -> if (from == stored.sealedText) return identity }
        val identity = runCatching { open(stored) }.getOrNull() ?: return null
        cached = stored.sealedText to identity
        return identity
    }

    /** Whether a request to host and port (-1 or 0 for the scheme's default) goes to the server the identity is for. */
    @JvmStatic
    fun matches(storedHost: String, storedPort: Int, host: String?, port: Int): Boolean {
        if (host == null || !host.equals(storedHost, ignoreCase = true)) return false
        val effective = if (port <= 0) 443 else port
        return effective == storedPort
    }

    /** Called where a server asked for a certificate, so the address screen can offer one. */
    @JvmStatic
    fun noteRequest(host: String?, port: Int, served: Boolean) {
        if (host == null) return
        lastRequest = Request(host.lowercase(Locale.ROOT), if (port <= 0) 443 else port, served)
    }

    /**
     * A socket factory for the app's own requests (the server check, map tiles).
     * It offers the identity only when the server it is talking to asks for one
     * and is the one the identity is for, and tells `onAsked` about every ask.
     */
    @JvmStatic
    fun socketFactory(context: Context, onAsked: ((host: String, port: Int, served: Boolean) -> Unit)? = null): SSLSocketFactory {
        val appContext = context.applicationContext
        val manager = object : X509ExtendedKeyManager() {
            // Decided per handshake in choose(); the key and chain are then read for
            // the one alias, so parallel connections never see each other's choice.
            private fun choose(host: String?, port: Int): String? {
                val identity = identityFor(appContext, host, port)
                if (host != null) {
                    noteRequest(host, port, identity != null)
                    onAsked?.invoke(host.lowercase(Locale.ROOT), if (port <= 0) 443 else port, identity != null)
                }
                return if (identity != null) KEYMANAGER_ALIAS else null
            }

            override fun chooseClientAlias(keyType: Array<out String>?, issuers: Array<out Principal>?, socket: Socket?): String? {
                val session = (socket as? SSLSocket)?.handshakeSession
                return choose(session?.peerHost, session?.peerPort ?: -1)
            }

            override fun chooseEngineClientAlias(keyType: Array<out String>?, issuers: Array<out Principal>?, engine: SSLEngine?): String? =
                choose(engine?.peerHost, engine?.peerPort ?: -1)

            override fun getCertificateChain(alias: String?): Array<X509Certificate>? =
                if (alias == KEYMANAGER_ALIAS) stored(appContext)?.let { opened(it) }?.chain else null
            override fun getPrivateKey(alias: String?): PrivateKey? =
                if (alias == KEYMANAGER_ALIAS) stored(appContext)?.let { opened(it) }?.key else null
            override fun getClientAliases(keyType: String?, issuers: Array<out Principal>?): Array<String>? = null
            override fun getServerAliases(keyType: String?, issuers: Array<out Principal>?): Array<String>? = null
            override fun chooseServerAlias(keyType: String?, issuers: Array<out Principal>?, socket: Socket?): String? = null
        }
        val tls = SSLContext.getInstance("TLS")
        tls.init(arrayOf(manager), null, null)
        return tls.socketFactory
    }

    private fun open(stored: Stored): Identity {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, wrapKey(), GCMParameterSpec(GCM_TAG_BITS, stored.iv))
        val key = KeyFactory.getInstance(stored.algorithm).generatePrivate(PKCS8EncodedKeySpec(cipher.doFinal(decode(stored.sealedText))))
        return Identity(key, stored.chain.map { certificate(it) }.toTypedArray())
    }

    private fun stored(context: Context): Stored? {
        val p = prefs(context)
        val host = p.getString("host", null) ?: return null
        val algorithm = p.getString("algorithm", null) ?: return null
        val key = p.getString("key", null) ?: return null
        val iv = p.getString("iv", null) ?: return null
        val chain = p.getString("chain", null)?.split(",")?.filter { it.isNotEmpty() }?.map { decode(it) } ?: return null
        if (chain.isEmpty()) return null
        return Stored(host, p.getInt("port", 443), algorithm, key, decode(iv), chain)
    }

    /** The keystore's AES key that seals the private key; made once, never leaves the keystore. */
    private fun wrapKey(): SecretKey {
        val keystore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keystore.getKey(WRAP_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(WRAP_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return generator.generateKey()
    }

    private fun certificate(der: ByteArray): X509Certificate =
        CertificateFactory.getInstance("X.509").generateCertificate(ByteArrayInputStream(der)) as X509Certificate

    /** The CN of a name, or the whole name when it has none. */
    @JvmStatic
    fun commonName(principal: javax.security.auth.x500.X500Principal): String {
        val name = principal.getName(javax.security.auth.x500.X500Principal.RFC2253)
        return Regex("(?:^|,)CN=((?:\\\\.|[^,])*)").find(name)?.groupValues?.get(1)?.replace("\\", "") ?: name
    }

    private fun prefs(context: Context) = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun encode(bytes: ByteArray) = Base64.encodeToString(bytes, Base64.NO_WRAP)
    private fun decode(text: String) = Base64.decode(text, Base64.NO_WRAP)
}
