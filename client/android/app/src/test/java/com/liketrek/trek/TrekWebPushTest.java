package com.liketrek.trek;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECPrivateKeySpec;
import java.util.Base64;
import org.junit.Test;

/** The decryption against the worked example in RFC 8291, section 5. */
public class TrekWebPushTest {

    private static byte[] b64(String value) {
        return Base64.getUrlDecoder().decode(value);
    }

    private static TrekPushKeys rfcKeys() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        ECPublicKey anyKey = (ECPublicKey) generator.generateKeyPair().getPublic();
        BigInteger d = new BigInteger(1, b64("q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94"));
        ECPrivateKey privateKey = (ECPrivateKey) KeyFactory.getInstance("EC").generatePrivate(new ECPrivateKeySpec(d, anyKey.getParams()));
        return new TrekPushKeys(
            privateKey,
            b64("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
            b64("BTBZMqHH6r4Tts7J_aSIgg")
        );
    }

    private static final String RECORD =
        "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN";

    @Test
    public void decryptsTheRfcExample() throws Exception {
        byte[] plain = TrekWebPush.decrypt(b64(RECORD), rfcKeys());
        assertEquals("When I grow up, I want to be a watermelon", new String(plain, StandardCharsets.UTF_8));
    }

    @Test
    public void refusesATamperedRecord() throws Exception {
        byte[] record = b64(RECORD);
        record[record.length - 1] ^= 1;
        assertThrows(Exception.class, () -> TrekWebPush.decrypt(record, rfcKeys()));
    }

    @Test
    public void writesThePublicKeyAsAFixedLengthPoint() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        for (int i = 0; i < 20; i++) {
            byte[] point = TrekPushKeys.uncompressed((ECPublicKey) generator.generateKeyPair().getPublic());
            assertEquals(65, point.length);
            assertEquals(4, point[0]);
        }
    }
}
