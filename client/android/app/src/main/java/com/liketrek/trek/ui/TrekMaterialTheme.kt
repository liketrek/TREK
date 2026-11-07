package com.liketrek.trek.ui

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

/**
 * The theme of the app's own native screens (the share sheet, the widget's trip
 * picker): Material You's wallpaper colours on Android 12 and later, TREK's
 * neutral palette before that, light and dark with the system.
 */
@Composable
fun TrekMaterialTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    val context = LocalContext.current
    val colors = when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        dark -> darkColorScheme(
            primary = Color(0xFFE4E4E7),
            onPrimary = Color(0xFF101013),
            secondary = Color(0xFF8AAEF0),
            secondaryContainer = Color(0xFF233250),
            onSecondaryContainer = Color(0xFFDCE6FA),
            surface = Color(0xFF0C0C0F),
            surfaceContainerLow = Color(0xFF16161A),
            surfaceContainer = Color(0xFF1B1B21),
            surfaceContainerHigh = Color(0xFF232329),
            onSurface = Color(0xFFF5F5F7),
            onSurfaceVariant = Color(0xFF9C9CA3),
        )
        else -> lightColorScheme(
            primary = Color(0xFF111827),
            onPrimary = Color(0xFFFFFFFF),
            secondary = Color(0xFF4A7DDB),
            secondaryContainer = Color(0xFFE4EAF7),
            onSecondaryContainer = Color(0xFF1B2F57),
            surface = Color(0xFFFDFCF9),
            surfaceContainerLow = Color(0xFFF4F2EE),
            surfaceContainer = Color(0xFFEFEDE8),
            surfaceContainerHigh = Color(0xFFE9E7E1),
            onSurface = Color(0xFF101013),
            onSurfaceVariant = Color(0xFF68686F),
        )
    }
    MaterialTheme(colorScheme = colors, content = content)
}
