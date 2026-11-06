package com.liketrek.trek;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Decrypts a Web Push record (RFC 8291, aes128gcm content coding of RFC 8188):
 * the same thing a browser does, and the counterpart of the iOS notification
 * extension's WebPushRecord. One record, as TREK's server always sends.
 */
final class TrekWebPush {

    private TrekWebPush() {}

    static byte[] decrypt(byte[] record, TrekPushKeys keys) throws Exception {
        if (record.length < 21) throw new IllegalArgumentException("record too short");
        byte[] salt = Arrays.copyOfRange(record, 0, 16);
        int idLength = record[20] & 0xff;
        if (idLength != 65 || record.length < 21 + idLength + 17) throw new IllegalArgumentException("unexpected header");
        byte[] senderKey = Arrays.copyOfRange(record, 21, 21 + idLength);
        byte[] ciphertext = Arrays.copyOfRange(record, 21 + idLength, record.length);

        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(keys.privateKey);
        agreement.doPhase(publicKeyFrom(senderKey, keys.privateKey), true);
        byte[] shared = agreement.generateSecret();

        byte[] keyInfo = concat("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), keys.publicKey, senderKey);
        byte[] ikm = hkdf(keys.auth, shared, keyInfo, 32);
        byte[] cek = hkdf(salt, ikm, "Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII), 16);
        byte[] nonce = hkdf(salt, ikm, "Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII), 12);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
        byte[] padded = cipher.doFinal(ciphertext);

        // Padding: the content, one delimiter (2 for the last record), then zeros.
        int end = padded.length - 1;
        while (end >= 0 && padded[end] == 0) end--;
        if (end < 0 || padded[end] != 2) throw new IllegalArgumentException("bad padding");
        return Arrays.copyOf(padded, end);
    }

    private static ECPublicKey publicKeyFrom(byte[] point, ECPrivateKey onCurve) throws Exception {
        if (point[0] != 0x04) throw new IllegalArgumentException("compressed key");
        BigInteger x = new BigInteger(1, Arrays.copyOfRange(point, 1, 33));
        BigInteger y = new BigInteger(1, Arrays.copyOfRange(point, 33, 65));
        return (ECPublicKey) KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(new ECPoint(x, y), onCurve.getParams()));
    }

    /** HKDF-SHA256 (RFC 5869) for outputs of at most one block. */
    private static byte[] hkdf(byte[] salt, byte[] ikm, byte[] info, int length) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(salt, "HmacSHA256"));
        byte[] prk = mac.doFinal(ikm);
        mac.init(new SecretKeySpec(prk, "HmacSHA256"));
        mac.update(info);
        mac.update((byte) 1);
        return Arrays.copyOf(mac.doFinal(), length);
    }

    private static byte[] concat(byte[]... parts) {
        int length = 0;
        for (byte[] part : parts) length += part.length;
        byte[] out = new byte[length];
        int offset = 0;
        for (byte[] part : parts) {
            System.arraycopy(part, 0, out, offset, part.length);
            offset += part.length;
        }
        return out;
    }
}
