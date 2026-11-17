package com.liketrek.trek;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * The device's Web Push key pair (P-256) and auth secret (RFC 8291). The server
 * encrypts every notification for these, and TrekPushService decrypts with
 * them. They are kept in the app's preferences, sealed with an AES key that
 * never leaves the Android Keystore, so a copy of the preferences alone opens
 * nothing.
 */
final class TrekPushKeys {

    private static final String PREFS = "trek_push";
    private static final String WRAP_ALIAS = "trek_push_wrap";
    private static final String PRIVATE = "private";
    private static final String PUBLIC = "public";
    private static final String AUTH = "auth";

    final ECPrivateKey privateKey;
    /** Uncompressed point, 65 bytes, as the server reads p256dh. */
    final byte[] publicKey;
    final byte[] auth;

    TrekPushKeys(ECPrivateKey privateKey, byte[] publicKey, byte[] auth) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.auth = auth;
    }

    /** The stored keys, or null when the app never subscribed. */
    static synchronized TrekPushKeys load(Context context) throws Exception {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String sealedPrivate = prefs.getString(PRIVATE, null);
        String publicKey = prefs.getString(PUBLIC, null);
        String sealedAuth = prefs.getString(AUTH, null);
        if (sealedPrivate == null || publicKey == null || sealedAuth == null) return null;
        byte[] pkcs8 = unseal(sealedPrivate);
        ECPrivateKey key = (ECPrivateKey) KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
        return new TrekPushKeys(key, Base64.decode(publicKey, Base64.NO_WRAP), unseal(sealedAuth));
    }

    static synchronized TrekPushKeys loadOrCreate(Context context) throws Exception {
        TrekPushKeys existing;
        try {
            existing = load(context);
        } catch (Exception unreadable) {
            // The Keystore key is gone (backup restored to another device, data
            // cleared): start over, the next subscription carries the new keys.
            existing = null;
        }
        if (existing != null) return existing;

        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair pair = generator.generateKeyPair();
        byte[] publicKey = uncompressed((ECPublicKey) pair.getPublic());
        byte[] auth = new byte[16];
        new SecureRandom().nextBytes(auth);
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(PRIVATE, seal(pair.getPrivate().getEncoded()))
            .putString(PUBLIC, Base64.encodeToString(publicKey, Base64.NO_WRAP))
            .putString(AUTH, seal(auth))
            .apply();
        return new TrekPushKeys((ECPrivateKey) pair.getPrivate(), publicKey, auth);
    }

    static String base64url(byte[] data) {
        return Base64.encodeToString(data, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
    }

    static byte[] uncompressed(ECPublicKey key) {
        byte[] out = new byte[65];
        out[0] = 0x04;
        copyFixed(key.getW().getAffineX(), out, 1);
        copyFixed(key.getW().getAffineY(), out, 33);
        return out;
    }

    /** A coordinate as exactly 32 bytes: BigInteger adds a sign byte or drops leading zeros. */
    private static void copyFixed(BigInteger value, byte[] out, int offset) {
        byte[] raw = value.toByteArray();
        int start = Math.max(0, raw.length - 32);
        int length = raw.length - start;
        System.arraycopy(raw, start, out, offset + 32 - length, length);
    }

    private static SecretKey wrapKey() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(WRAP_ALIAS)) return ((KeyStore.SecretKeyEntry) store.getEntry(WRAP_ALIAS, null)).getSecretKey();
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(
            new KeyGenParameterSpec.Builder(WRAP_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        );
        return generator.generateKey();
    }

    private static String seal(byte[] plain) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, wrapKey());
        byte[] iv = cipher.getIV();
        byte[] sealed = cipher.doFinal(plain);
        byte[] out = new byte[iv.length + sealed.length];
        System.arraycopy(iv, 0, out, 0, iv.length);
        System.arraycopy(sealed, 0, out, iv.length, sealed.length);
        return Base64.encodeToString(out, Base64.NO_WRAP);
    }

    private static byte[] unseal(String value) throws Exception {
        byte[] in = Base64.decode(value, Base64.NO_WRAP);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, wrapKey(), new GCMParameterSpec(128, in, 0, 12));
        return cipher.doFinal(in, 12, in.length - 12);
    }
}
