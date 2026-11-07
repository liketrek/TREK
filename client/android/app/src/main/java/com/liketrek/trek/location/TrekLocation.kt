package com.liketrek.trek.location

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.os.Build
import androidx.core.location.LocationListenerCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.location.LocationRequestCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import org.json.JSONObject

/**
 * One location stream for the UI's navigator.geolocation (native/geolocation.ts),
 * the counterpart of TrekLocation in TrekShellPlugin.swift: the system's fused
 * provider where there is one (Android 12+), GPS and network before, with
 * positions and errors shaped like the Geolocation API's. Asking for the
 * permission is the plugin's part; this starts once it is granted.
 */
class TrekLocation(context: Context, private val emit: (JSObject) -> Unit) {
    private val manager = context.getSystemService(LocationManager::class.java)
    private val executor = ContextCompat.getMainExecutor(context)
    private val listeners = mutableListOf<LocationListenerCompat>()

    @SuppressLint("MissingPermission")
    fun start(highAccuracy: Boolean) {
        stop()
        if (manager == null || !LocationManagerCompat.isLocationEnabled(manager)) {
            emitError(2, "Location services are off")
            return
        }
        val request = LocationRequestCompat.Builder(if (highAccuracy) 2_000L else 10_000L)
            .setQuality(if (highAccuracy) LocationRequestCompat.QUALITY_HIGH_ACCURACY else LocationRequestCompat.QUALITY_BALANCED_POWER_ACCURACY)
            .setMinUpdateDistanceMeters(if (highAccuracy) 2f else 25f)
            .build()
        val providers = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && manager.hasProvider(LocationManager.FUSED_PROVIDER) -> listOf(LocationManager.FUSED_PROVIDER)
            else -> listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).filter { manager.isProviderEnabled(it) }
        }
        if (providers.isEmpty()) {
            emitError(2, "No location provider")
            return
        }
        // The last known fix answers getCurrentPosition at once; a fresh one follows.
        providers.mapNotNull { runCatching { manager.getLastKnownLocation(it) }.getOrNull() }
            .maxByOrNull { it.time }
            ?.takeIf { System.currentTimeMillis() - it.time < 120_000 }
            ?.let { emit(payload(it)) }
        for (provider in providers) {
            val listener = LocationListenerCompat { location -> emit(payload(location)) }
            try {
                LocationManagerCompat.requestLocationUpdates(manager, provider, request, executor, listener)
                listeners += listener
            } catch (e: SecurityException) {
                emitError(1, "Location permission denied")
                return
            }
        }
    }

    fun stop() {
        val m = manager ?: return
        for (listener in listeners) LocationManagerCompat.removeUpdates(m, listener)
        listeners.clear()
    }

    fun emitError(code: Int, message: String) {
        emit(JSObject().put("error", JSObject().put("code", code).put("message", message)))
    }

    companion object {
        fun payload(location: Location): JSObject = JSObject()
            .put("latitude", location.latitude)
            .put("longitude", location.longitude)
            .put("accuracy", location.accuracy.toDouble())
            .put("altitude", if (location.hasAltitude()) location.altitude else JSONObject.NULL)
            .put("speed", if (location.hasSpeed()) location.speed.toDouble() else JSONObject.NULL)
            .put("heading", if (location.hasBearing()) location.bearing.toDouble() else JSONObject.NULL)
            .put("timestamp", location.time.toDouble())
    }
}
