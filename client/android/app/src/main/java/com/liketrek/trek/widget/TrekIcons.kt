package com.liketrek.trek.widget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AcUnit
import androidx.compose.material.icons.rounded.AccountBalance
import androidx.compose.material.icons.rounded.Backpack
import androidx.compose.material.icons.rounded.BeachAccess
import androidx.compose.material.icons.rounded.Bed
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.Chat
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Checklist
import androidx.compose.material.icons.rounded.Cloud
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material.icons.rounded.DirectionsBoat
import androidx.compose.material.icons.rounded.DirectionsBus
import androidx.compose.material.icons.rounded.DirectionsCar
import androidx.compose.material.icons.rounded.DirectionsRun
import androidx.compose.material.icons.rounded.DirectionsWalk
import androidx.compose.material.icons.rounded.Event
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.Flag
import androidx.compose.material.icons.rounded.Flight
import androidx.compose.material.icons.rounded.FlightTakeoff
import androidx.compose.material.icons.rounded.Dehaze
import androidx.compose.material.icons.rounded.Forest
import androidx.compose.material.icons.rounded.Grain
import androidx.compose.material.icons.rounded.Group
import androidx.compose.material.icons.rounded.Hiking
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Hotel
import androidx.compose.material.icons.rounded.Landscape
import androidx.compose.material.icons.rounded.LocalBar
import androidx.compose.material.icons.rounded.LocalCafe
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.LocalLibrary
import androidx.compose.material.icons.rounded.Luggage
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.Navigation
import androidx.compose.material.icons.rounded.Park
import androidx.compose.material.icons.rounded.Place
import androidx.compose.material.icons.rounded.Poll
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.Restaurant
import androidx.compose.material.icons.rounded.Sailing
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.ShoppingBag
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.Storefront
import androidx.compose.material.icons.rounded.Thunderstorm
import androidx.compose.material.icons.rounded.TheaterComedy
import androidx.compose.material.icons.rounded.ConfirmationNumber
import androidx.compose.material.icons.rounded.Train
import androidx.compose.material.icons.rounded.Water
import androidx.compose.material.icons.rounded.WbCloudy
import androidx.compose.material.icons.rounded.WbSunny
import androidx.compose.material.icons.rounded.Cabin
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.VectorGroup
import androidx.compose.ui.graphics.vector.VectorNode
import androidx.compose.ui.graphics.vector.VectorPath
import androidx.compose.ui.graphics.vector.PathParser
import androidx.glance.ImageProvider

/**
 * The widgets' icons: the Material Symbols (rounded) counterparts of the SF
 * Symbols the snapshot names, so one snapshot draws on both platforms. A widget
 * is RemoteViews, which cannot draw a Compose vector, so each icon is drawn
 * once into a small white bitmap and tinted by the widget's theme colour.
 */
object TrekIcons {
    /** The SF Symbol names client/src/native/widgetExtras.ts and widgets.ts use, and a few of the widgets' own. */
    private val SYMBOLS: Map<String, ImageVector> = mapOf(
        "airplane" to Icons.Rounded.Flight,
        "airplane.departure" to Icons.Rounded.FlightTakeoff,
        "tram.fill" to Icons.Rounded.Train,
        "bus.fill" to Icons.Rounded.DirectionsBus,
        "car.fill" to Icons.Rounded.DirectionsCar,
        "ferry.fill" to Icons.Rounded.DirectionsBoat,
        "sailboat.fill" to Icons.Rounded.Sailing,
        "bed.double.fill" to Icons.Rounded.Hotel,
        "house.fill" to Icons.Rounded.Home,
        "tent.fill" to Icons.Rounded.Cabin,
        "fork.knife" to Icons.Rounded.Restaurant,
        "cup.and.saucer.fill" to Icons.Rounded.LocalCafe,
        "mug.fill" to Icons.Rounded.LocalCafe,
        "wineglass.fill" to Icons.Rounded.LocalBar,
        "ticket.fill" to Icons.Rounded.ConfirmationNumber,
        "theatermasks.fill" to Icons.Rounded.TheaterComedy,
        "music.note" to Icons.Rounded.MusicNote,
        "figure.hiking" to Icons.Rounded.Hiking,
        "figure.walk" to Icons.Rounded.DirectionsWalk,
        "figure.run" to Icons.Rounded.DirectionsRun,
        "dumbbell.fill" to Icons.Rounded.FitnessCenter,
        "bookmark.fill" to Icons.Rounded.Bookmark,
        "building.columns.fill" to Icons.Rounded.AccountBalance,
        "building.2.fill" to Icons.Rounded.AccountBalance,
        "books.vertical.fill" to Icons.Rounded.LocalLibrary,
        "storefront.fill" to Icons.Rounded.Storefront,
        "bag.fill" to Icons.Rounded.ShoppingBag,
        "backpack.fill" to Icons.Rounded.Backpack,
        "suitcase.rolling.fill" to Icons.Rounded.Luggage,
        "creditcard.fill" to Icons.Rounded.CreditCard,
        "cross.case.fill" to Icons.Rounded.LocalHospital,
        "camera.fill" to Icons.Rounded.CameraAlt,
        "camera.macro" to Icons.Rounded.Park,
        "leaf.fill" to Icons.Rounded.Park,
        "tree.fill" to Icons.Rounded.Forest,
        "mountain.2.fill" to Icons.Rounded.Landscape,
        "water.waves" to Icons.Rounded.Water,
        "beach.umbrella.fill" to Icons.Rounded.BeachAccess,
        "sun.max.fill" to Icons.Rounded.WbSunny,
        "bolt.fill" to Icons.Rounded.Bolt,
        "heart.fill" to Icons.Rounded.Favorite,
        "star.fill" to Icons.Rounded.Star,
        "flag.fill" to Icons.Rounded.Flag,
        "map.fill" to Icons.Rounded.Map,
        "safari.fill" to Icons.Rounded.Navigation,
        "location.north.fill" to Icons.Rounded.Navigation,
        "location.fill" to Icons.Rounded.Place,
        "globe.europe.africa.fill" to Icons.Rounded.Public,
        "calendar" to Icons.Rounded.CalendarMonth,
        "clock" to Icons.Rounded.Schedule,
        "checklist" to Icons.Rounded.Checklist,
        "checkmark.circle.fill" to Icons.Rounded.CheckCircle,
        "person.2.fill" to Icons.Rounded.Group,
        "bubble.left.fill" to Icons.Rounded.Chat,
        "chart.bar.fill" to Icons.Rounded.Poll,
        "event" to Icons.Rounded.Event,
    )

    /** A booking kind's symbol and colour, the same pairs as TrekStyle.swift. */
    fun booking(kind: String): Pair<String, Int> = when (kind) {
        "flight" -> "airplane" to 0xFF4A7DDB.toInt()
        "train" -> "tram.fill" to 0xFF2FA37A.toInt()
        "bus" -> "bus.fill" to 0xFF2BA6A6.toInt()
        "car" -> "car.fill" to 0xFFD6673B.toInt()
        "cruise", "ferry", "boat" -> "ferry.fill" to 0xFF2E8BC0.toInt()
        "hotel" -> "bed.double.fill" to 0xFF8E6CD9.toInt()
        "restaurant" -> "fork.knife" to 0xFFE8A13A.toInt()
        "event" -> "ticket.fill" to 0xFFD6408B.toInt()
        "tour" -> "figure.hiking" to 0xFF4E9F3D.toInt()
        else -> "bookmark.fill" to 0xFF7A7A85.toInt()
    }

    /** The provider's main weather condition as an icon. */
    fun weather(main: String): ImageVector = when (main.lowercase()) {
        "clear" -> Icons.Rounded.WbSunny
        "clouds" -> Icons.Rounded.WbCloudy
        "rain", "drizzle" -> Icons.Rounded.Grain
        "thunderstorm" -> Icons.Rounded.Thunderstorm
        "snow" -> Icons.Rounded.AcUnit
        "mist", "fog", "haze" -> Icons.Rounded.Dehaze
        else -> Icons.Rounded.Cloud
    }

    fun vector(symbol: String?): ImageVector = symbol?.let { SYMBOLS[it] } ?: Icons.Rounded.Place

    private val cache = HashMap<Pair<ImageVector, Int>, Bitmap>()

    /** The icon as a white bitmap of [sizePx], tinted where it is drawn. */
    @Synchronized
    fun bitmap(vector: ImageVector, sizePx: Int = 48): Bitmap = cache.getOrPut(vector to sizePx) { render(vector, sizePx) }

    fun provider(symbol: String?, sizePx: Int = 48): ImageProvider = ImageProvider(bitmap(vector(symbol), sizePx))

    fun provider(vector: ImageVector, sizePx: Int = 48): ImageProvider = ImageProvider(bitmap(vector, sizePx))

    /** The icon in [color], for places that draw it as it is (a notification's progress tracker). */
    fun bitmap(vector: ImageVector, sizePx: Int, color: Int): Bitmap = render(vector, sizePx, color)

    private fun render(vector: ImageVector, sizePx: Int, color: Int = android.graphics.Color.WHITE): Bitmap {
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val scale = Matrix().apply { setScale(sizePx / vector.viewportWidth, sizePx / vector.viewportHeight) }
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color
            style = Paint.Style.FILL
        }
        fun draw(node: VectorNode) {
            when (node) {
                is VectorGroup -> node.forEach { draw(it) }
                is VectorPath -> {
                    val path: Path = PathParser().addPathNodes(node.pathData).toPath().asAndroidPath()
                    path.fillType = if (node.pathFillType == androidx.compose.ui.graphics.PathFillType.EvenOdd) {
                        Path.FillType.EVEN_ODD
                    } else {
                        Path.FillType.WINDING
                    }
                    path.transform(scale)
                    canvas.drawPath(path, paint)
                }
            }
        }
        draw(vector.root)
        return bitmap
    }
}
