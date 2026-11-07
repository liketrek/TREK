package com.liketrek.trek.share

import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.text.format.Formatter
import android.view.HapticFeedbackConstants
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Image
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.PictureAsPdf
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.ShortText
import androidx.compose.material.icons.rounded.Wallet
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.lifecycle.lifecycleScope
import com.liketrek.trek.MainActivity
import com.liketrek.trek.R
import com.liketrek.trek.ui.TrekMaterialTheme
import com.liketrek.trek.widget.WidgetArt
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * "TREK" in the system share sheet (and "Open with TREK"): a Material bottom
 * sheet over the app that shared, showing what came in, the trip it goes to and
 * one button, the counterpart of the iOS share extension (ShareView.swift). The
 * item and the trip are left for the app (ShareHandoff) and TREK opens, where
 * the booking import takes over. A direct-share shortcut of a trip
 * (TrekShortcuts) arrives with that trip already picked.
 */
class ShareActivity : ComponentActivity() {
    private sealed interface Phase {
        data object Loading : Phase
        data object Ready : Phase
        data object Saving : Phase
        data object Done : Phase
        data class Failed(val message: Int) : Phase
    }

    private var phase by mutableStateOf<Phase>(Phase.Loading)
    private var item by mutableStateOf<ShareItem?>(null)
    private var trips by mutableStateOf<List<ShareHandoff.Trip>>(emptyList())
    private var selected by mutableStateOf<Long?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        trips = ShareHandoff.trips(this)
        val shortcutTrip = intent.getStringExtra(ShortcutManagerCompat.EXTRA_SHORTCUT_ID)?.removePrefix("trip.")?.toLongOrNull()
        selected = shortcutTrip?.takeIf { id -> trips.any { it.id == id } } ?: trips.firstOrNull()?.id
        val incoming = intent
        lifecycleScope.launch {
            phase = try {
                item = withContext(Dispatchers.IO) { ShareLoader.load(incoming, contentResolver) }
                Phase.Ready
            } catch (e: ShareLoadException) {
                Phase.Failed(if (e.reason == ShareLoadException.Reason.TOO_LARGE) R.string.share_too_large else R.string.share_unsupported)
            } catch (e: Exception) {
                Phase.Failed(R.string.share_unsupported)
            }
        }
        setContent {
            TrekMaterialTheme {
                Sheet()
            }
        }
    }

    private fun add() {
        val current = item ?: return
        if (phase != Phase.Ready) return
        phase = Phase.Saving
        lifecycleScope.launch {
            val stored = withContext(Dispatchers.IO) { ShareHandoff.store(this@ShareActivity, current, selected) }
            if (!stored) {
                window.decorView.performHapticFeedback(HapticFeedbackConstants.REJECT)
                phase = Phase.Failed(R.string.share_failed)
                return@launch
            }
            window.decorView.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
            phase = Phase.Done
            delay(850)
            startActivity(
                Intent(this@ShareActivity, MainActivity::class.java)
                    .setAction(MainActivity.ACTION_SHARE_HANDOFF)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            )
            finish()
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    private fun Sheet() {
        val state = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val scope = rememberCoroutineScope()
        val dismiss: () -> Unit = {
            scope.launch { state.hide() }.invokeOnCompletion { finish() }
        }
        ModalBottomSheet(
            onDismissRequest = { finish() },
            sheetState = state,
            containerColor = MaterialTheme.colorScheme.surfaceContainerLow,
        ) {
            Column(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(bottom = 12.dp)) {
                Header(onClose = dismiss)
                Spacer(Modifier.height(16.dp))
                when (val now = phase) {
                    is Phase.Failed -> Failure(stringResource(now.message), onClose = dismiss)
                    else -> Content(now)
                }
            }
        }
    }

    @Composable
    private fun Header(onClose: () -> Unit) {
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center,
            ) {
                Text("T", color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Black, fontSize = 21.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("TREK", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, letterSpacing = 2.4.sp)
                Text(stringResource(R.string.share_title), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = onClose) { Text(stringResource(R.string.share_cancel)) }
        }
    }

    @Composable
    private fun Content(now: Phase) {
        Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
            ItemCard(item, Modifier.padding(horizontal = 20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    stringResource(R.string.share_trip).uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp,
                    modifier = Modifier.padding(horizontal = 22.dp),
                )
                if (trips.isEmpty()) {
                    Text(
                        stringResource(R.string.share_no_trips),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 22.dp),
                    )
                } else {
                    TripRail()
                }
            }
            Text(
                stringResource(R.string.share_hint),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 22.dp),
            )
            AddButton(now)
        }
    }

    @Composable
    private fun ItemCard(item: ShareItem?, modifier: Modifier) {
        val context = LocalContext.current
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceContainerHigh,
            modifier = modifier.fillMaxWidth(),
        ) {
            Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(46.dp).clip(RoundedCornerShape(14.dp)).background(MaterialTheme.colorScheme.secondaryContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    if (item == null) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(kindIcon(item.kind), null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
                    }
                }
                Spacer(Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        item?.title ?: stringResource(R.string.share_reading),
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    if (item != null) {
                        val parts = listOfNotNull(stringResource(kindLabel(item.kind)), Formatter.formatShortFileSize(context, item.data.size.toLong()), item.source)
                        Text(parts.joinToString(", "), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                    }
                }
            }
        }
    }

    @Composable
    private fun TripRail() {
        LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(trips, key = { it.id }) { trip ->
                TripCard(trip, selected == trip.id) { selected = trip.id }
            }
            item {
                FilterChip(
                    selected = selected == null,
                    onClick = { selected = null },
                    label = { Text(stringResource(R.string.share_later)) },
                    leadingIcon = { Icon(Icons.Rounded.Schedule, null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.height(132.dp).padding(vertical = 44.dp),
                )
            }
        }
    }

    @Composable
    private fun TripCard(trip: ShareHandoff.Trip, isSelected: Boolean, onClick: () -> Unit) {
        val view = LocalView.current
        val cover: Bitmap? = remember(trip.id) { WidgetArt.cover(trip.cover, 360) ?: WidgetArt.sky(trip.title, 300, 200) }
        val border = if (isSelected) BorderStroke(3.dp, MaterialTheme.colorScheme.primary) else BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
        Surface(
            shape = RoundedCornerShape(20.dp),
            border = border,
            modifier = Modifier.width(168.dp).height(132.dp).clip(RoundedCornerShape(20.dp)).clickable {
                view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                onClick()
            },
        ) {
            Box {
                if (cover != null) {
                    Image(cover.asImageBitmap(), null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                }
                Box(
                    modifier = Modifier.fillMaxSize().background(
                        Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.1f), Color.Black.copy(alpha = 0.68f))),
                    ),
                )
                if (isSelected) {
                    Box(
                        modifier = Modifier.padding(8.dp).size(24.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary).align(Alignment.TopEnd),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.Check, null, tint = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(16.dp))
                    }
                }
                Column(modifier = Modifier.align(Alignment.BottomStart).padding(12.dp)) {
                    Text(when_(trip), color = Color.White.copy(alpha = 0.82f), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    Text(trip.title, color = Color.White, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }

    @Composable
    private fun when_(trip: ShareHandoff.Trip): String {
        val today = LocalDate.now()
        val start = trip.start
        val end = trip.end
        return when {
            end != null && end < today -> stringResource(R.string.share_past)
            start == null || start <= today -> stringResource(R.string.share_now)
            ChronoUnit.DAYS.between(today, start) == 1L -> stringResource(R.string.share_tomorrow)
            else -> stringResource(R.string.share_in_days, ChronoUnit.DAYS.between(today, start).toInt())
        }
    }

    @Composable
    private fun AddButton(now: Phase) {
        val title = trips.firstOrNull { it.id == selected }?.title
        Button(
            onClick = ::add,
            enabled = now == Phase.Ready,
            shape = RoundedCornerShape(18.dp),
            colors = if (now == Phase.Done) {
                ButtonDefaults.buttonColors(containerColor = Color(0xFF2FA37A), disabledContainerColor = Color(0xFF2FA37A), disabledContentColor = Color.White)
            } else {
                ButtonDefaults.buttonColors()
            },
            contentPadding = PaddingValues(vertical = 16.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
        ) {
            AnimatedContent(
                targetState = now,
                transitionSpec = { (fadeIn() + scaleIn(spring(dampingRatio = 0.6f))) togetherWith fadeOut() },
                label = "add",
            ) { target ->
                when (target) {
                    Phase.Saving, Phase.Loading -> CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    Phase.Done -> Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.Check, null)
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.share_added), fontWeight = FontWeight.Bold)
                    }
                    else -> Text(
                        if (title != null) stringResource(R.string.share_add_to, title) else stringResource(R.string.share_add),
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }

    @Composable
    private fun Failure(message: String, onClose: () -> Unit) {
        Column(modifier = Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Rounded.ErrorOutline, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(40.dp))
            Spacer(Modifier.height(12.dp))
            Text(message, style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(16.dp))
            Button(onClick = onClose, shape = RoundedCornerShape(18.dp)) { Text(stringResource(R.string.share_close)) }
        }
    }

    private fun kindIcon(kind: ShareItem.Kind): ImageVector = when (kind) {
        ShareItem.Kind.PASS -> Icons.Rounded.Wallet
        ShareItem.Kind.PDF -> Icons.Rounded.PictureAsPdf
        ShareItem.Kind.MAIL -> Icons.Rounded.Email
        ShareItem.Kind.CALENDAR -> Icons.Rounded.CalendarMonth
        ShareItem.Kind.PAGE -> Icons.Rounded.Language
        ShareItem.Kind.TEXT -> Icons.Rounded.ShortText
        ShareItem.Kind.IMAGE -> Icons.Rounded.Image
        ShareItem.Kind.FILE -> Icons.Rounded.Description
    }

    private fun kindLabel(kind: ShareItem.Kind): Int = when (kind) {
        ShareItem.Kind.PASS -> R.string.share_kind_pass
        ShareItem.Kind.PDF -> R.string.share_kind_pdf
        ShareItem.Kind.MAIL -> R.string.share_kind_mail
        ShareItem.Kind.CALENDAR -> R.string.share_kind_file
        ShareItem.Kind.PAGE -> R.string.share_kind_page
        ShareItem.Kind.TEXT -> R.string.share_kind_text
        ShareItem.Kind.IMAGE -> R.string.share_kind_image
        ShareItem.Kind.FILE -> R.string.share_kind_file
    }
}
