package com.liketrek.trek

import com.liketrek.trek.clientcert.ClientCertWatch
import com.liketrek.trek.clientcert.TrekClientIdentity
import com.liketrek.trek.clientcert.TrekClientIdentity.Failure
import java.util.Date
import javax.security.auth.x500.X500Principal
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

/**
 * Reading a client certificate file (TrekClientIdentity.read) and the rule for
 * which server sees it. The files in test/resources/clientcert are test-only:
 * a throwaway CA, password "trek-test". valid.p12 has OpenSSL 3's default
 * encryption (AES-256, PBKDF2), valid-legacy.p12 the older RC2/3DES one that
 * many routers and NAS systems still export.
 */
class ClientIdentityTest {
    private val password = "trek-test".toCharArray()
    private val inside = Date(1_800_000_000_000L) // 2027-01-15, inside every valid test certificate

    private fun file(name: String): ByteArray =
        requireNotNull(javaClass.classLoader?.getResourceAsStream("clientcert/$name")) { name }.use { it.readBytes() }

    private fun failure(name: String, pass: CharArray = password, now: Date = inside): Failure {
        try {
            TrekClientIdentity.read(file(name), pass, now)
        } catch (e: TrekClientIdentity.ImportException) {
            return e.reason
        }
        fail("$name opened")
        throw AssertionError()
    }

    @Test
    fun opensModernAndLegacyFiles() {
        for (name in listOf("valid.p12", "valid-legacy.p12")) {
            val identity = TrekClientIdentity.read(file(name), password, inside)
            assertEquals("trek-test-valid", TrekClientIdentity.commonName(identity.chain[0].subjectX500Principal))
            assertEquals("TREK mTLS Test CA", TrekClientIdentity.commonName(identity.chain[0].issuerX500Principal))
            assertEquals("RSA", identity.key.algorithm)
        }
    }

    @Test
    fun namesWhatIsWrongWithAFile() {
        assertEquals(Failure.PASSWORD, failure("valid.p12", "wrong".toCharArray()))
        assertEquals(Failure.PASSWORD, failure("valid-legacy.p12", "wrong".toCharArray()))
        assertEquals(Failure.EXPIRED, failure("expired.p12"))
        assertEquals(Failure.NOT_YET_VALID, failure("future.p12"))
        assertEquals(Failure.NO_KEY, failure("cert-only.p12"))
        try {
            TrekClientIdentity.read("not a certificate".toByteArray(), password, inside)
            fail("text opened")
        } catch (e: TrekClientIdentity.ImportException) {
            assertEquals(Failure.FORMAT, e.reason)
        }
    }

    @Test
    fun showsTheCertificateOnlyToItsHostAndPort() {
        assertTrue(TrekClientIdentity.matches("trek.example.com", 443, "Trek.Example.com", -1))
        assertTrue(TrekClientIdentity.matches("trek.example.com", 443, "trek.example.com", 443))
        assertTrue(TrekClientIdentity.matches("nas.local", 8443, "nas.local", 8443))
        assertFalse(TrekClientIdentity.matches("trek.example.com", 443, "auth.example.com", 443))
        assertFalse(TrekClientIdentity.matches("trek.example.com", 443, "trek.example.com", 8443))
        assertFalse(TrekClientIdentity.matches("nas.local", 8443, "nas.local", -1))
        assertFalse(TrekClientIdentity.matches("trek.example.com", 443, null, 443))
    }

    @Test
    fun leavesForTheAddressScreenOnlyWhenTheCertificateIsWhatFails() {
        assertTrue(ClientCertWatch.refused(true, 0)) // handshake broken off: nginx, Caddy, Traefik
        assertTrue(ClientCertWatch.refused(true, 403)) // Cloudflare's block page
        assertTrue(ClientCertWatch.refused(true, 400)) // nginx without a valid certificate
        assertFalse(ClientCertWatch.refused(true, 200)) // asks, but lets everyone in
        assertFalse(ClientCertWatch.refused(true, 502)) // TREK restarting behind the proxy
        assertFalse(ClientCertWatch.refused(false, 0)) // simply offline
    }

    @Test
    fun readsTheCommonNameOrFallsBackToTheWholeName() {
        assertEquals("Phone, home", TrekClientIdentity.commonName(X500Principal("CN=Phone\\, home,O=Family")))
        assertEquals("O=Family", TrekClientIdentity.commonName(X500Principal("O=Family")))
    }
}
