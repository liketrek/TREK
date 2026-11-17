package com.liketrek.trek.screen

import android.view.KeyEvent
import android.view.KeyboardShortcutGroup
import android.view.KeyboardShortcutInfo
import org.json.JSONArray
import org.json.JSONObject

/**
 * The UI's keyboard shortcuts as the app's own (TrekShell.setKeyCommands, feature
 * keyCommands), the Android side of TrekKeyCommands in the iOS shell: a hardware
 * keyboard's shortcut runs the UI's command even while the focus sits outside the
 * page, and the system's shortcut list (Meta + /) shows them under their names in
 * the UI's language. Each screen replaces the list, so only what works here is on it.
 *
 * "command" is Ctrl on Android (Meta is accepted too, for keyboards made for a Mac),
 * "option" is Alt.
 */
object TrekKeyCommands {
    data class Command(val id: String, val title: String, val keyCode: Int, val modifiers: Int)

    @Volatile var current: List<Command> = emptyList()
        private set

    var onPress: ((String) -> Unit)? = null

    fun set(raw: JSONArray?) {
        current = parse(raw)
    }

    fun parse(raw: JSONArray?): List<Command> {
        if (raw == null) return emptyList()
        return (0 until raw.length()).mapNotNull { i ->
            val o: JSONObject = raw.optJSONObject(i) ?: return@mapNotNull null
            val id = o.optString("id").ifEmpty { return@mapNotNull null }
            val title = o.optString("title").ifEmpty { return@mapNotNull null }
            val key = keyCode(o.optString("input")) ?: return@mapNotNull null
            var meta = 0
            val mods = o.optJSONArray("modifiers")
            for (j in 0 until (mods?.length() ?: 0)) {
                meta = meta or when (mods!!.optString(j)) {
                    "command", "control" -> KeyEvent.META_CTRL_ON
                    "shift" -> KeyEvent.META_SHIFT_ON
                    "option" -> KeyEvent.META_ALT_ON
                    else -> 0
                }
            }
            Command(id, title, key, meta)
        }
    }

    /** The key a UI input names: a letter, a digit, an arrow, escape or a punctuation mark. */
    fun keyCode(input: String): Int? = when (input.lowercase()) {
        "left" -> KeyEvent.KEYCODE_DPAD_LEFT
        "right" -> KeyEvent.KEYCODE_DPAD_RIGHT
        "up" -> KeyEvent.KEYCODE_DPAD_UP
        "down" -> KeyEvent.KEYCODE_DPAD_DOWN
        "escape" -> KeyEvent.KEYCODE_ESCAPE
        "enter", "\r" -> KeyEvent.KEYCODE_ENTER
        "," -> KeyEvent.KEYCODE_COMMA
        "." -> KeyEvent.KEYCODE_PERIOD
        "/" -> KeyEvent.KEYCODE_SLASH
        "[" -> KeyEvent.KEYCODE_LEFT_BRACKET
        "]" -> KeyEvent.KEYCODE_RIGHT_BRACKET
        "-" -> KeyEvent.KEYCODE_MINUS
        "=" -> KeyEvent.KEYCODE_EQUALS
        " ", "space" -> KeyEvent.KEYCODE_SPACE
        else -> when {
            input.length == 1 && input[0].lowercaseChar() in 'a'..'z' -> KeyEvent.KEYCODE_A + (input[0].lowercaseChar() - 'a')
            input.length == 1 && input[0] in '0'..'9' -> KeyEvent.KEYCODE_0 + (input[0] - '0')
            else -> null
        }
    }

    private const val MASK = KeyEvent.META_CTRL_ON or KeyEvent.META_SHIFT_ON or KeyEvent.META_ALT_ON

    /** The command a key press stands for, if any. Meta counts as Ctrl. */
    fun match(keyCode: Int, metaState: Int): Command? {
        var state = metaState
        if (state and KeyEvent.META_META_ON != 0) state = state or KeyEvent.META_CTRL_ON
        val pressed = state and MASK
        return current.firstOrNull { it.keyCode == keyCode && it.modifiers == pressed }
    }

    /** Runs the matching command for a key going down. True when one took it. */
    fun dispatch(event: KeyEvent): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN || event.repeatCount > 0) return false
        val command = match(event.keyCode, event.metaState) ?: return false
        // A plain key (no modifier) is left to a text field that has the focus.
        if (command.modifiers == 0 && event.keyCode != KeyEvent.KEYCODE_ESCAPE) return false
        val press = onPress ?: return false
        press(command.id)
        return true
    }

    /** The list the system shows for Meta + /. */
    fun shortcutGroup(label: CharSequence): KeyboardShortcutGroup? {
        val items = current.map { KeyboardShortcutInfo(it.title, it.keyCode, it.modifiers) }
        return if (items.isEmpty()) null else KeyboardShortcutGroup(label, items)
    }
}
