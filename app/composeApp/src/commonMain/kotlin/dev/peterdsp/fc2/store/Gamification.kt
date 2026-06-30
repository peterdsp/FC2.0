package dev.peterdsp.fc2.store

import com.russhwolf.settings.Settings
import dev.peterdsp.fc2.platform.nowMillis
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** Level ladder — identical thresholds to `web/js/data.js` `LEVELS`. */
data class Level(val lvl: Int, val xp: Int, val title: String)

val LEVELS = listOf(
    Level(1, 0, "Ακροατής"),
    Level(2, 120, "Φανατικός"),
    Level(3, 320, "Μουσαντέρ"),
    Level(4, 640, "Λεξικογράφος"),
    Level(5, 1100, "Γκόντζος Energy"),
    Level(6, 1800, "Θρύλος του FC"),
)

@Serializable
private data class Persisted(
    val xp: Int = 0,
    val streak: Int = 0,
    val lastActive: Long = -1,
    val packProgress: Map<String, Int> = emptyMap(),
    val bestScores: Map<String, Int> = emptyMap(),
    val dailyDone: Long = -1,
)

/** Snapshot the UI renders (mirror of the web `getView()` shape). */
data class GamificationView(
    val xp: Int,
    val streak: Int,
    val level: Int,
    val title: String,
    val progress: Float,
    val toNext: Int,
    val bestScores: Map<String, Int>,
    val packProgress: Map<String, Int>,
    val dailyDone: Boolean,
)

private const val KEY = "fc2_state_v1"
private const val DAY_MS = 86_400_000L
private fun epochDay(millis: Long = nowMillis()): Long = millis / DAY_MS

/**
 * The "don't-want-to-leave" loop: XP + levels + daily streaks, persisted via
 * multiplatform-settings. Port of `web/js/gamification.js`.
 */
class Gamification(private val settings: Settings) {

    private val json = Json { ignoreUnknownKeys = true }
    private var state: Persisted = load()

    private val _view = MutableStateFlow(view())
    val view: StateFlow<GamificationView> = _view.asStateFlow()

    private fun load(): Persisted = runCatching {
        settings.getStringOrNull(KEY)?.let { json.decodeFromString<Persisted>(it) }
    }.getOrNull() ?: Persisted()

    private fun save() {
        settings.putString(KEY, json.encodeToString(state))
        _view.value = view()
    }

    /** Roll the streak forward, or reset it on a missed day. */
    fun touchStreak() {
        val today = epochDay()
        if (state.lastActive == today) return
        val streak = if (state.lastActive == today - 1) state.streak + 1 else 1
        state = state.copy(streak = streak, lastActive = today)
        save()
    }

    private fun addXp(amount: Int): LevelUp {
        val before = currentLevel().lvl
        state = state.copy(xp = state.xp + amount)
        save()
        val after = currentLevel().lvl
        return LevelUp(after > before, after)
    }

    fun recordQuiz(packId: String, correct: Int, total: Int, xpGained: Int): LevelUp {
        val pct = ((correct.toFloat() / total) * 100).toInt()
        state = state.copy(
            bestScores = state.bestScores + (packId to maxOf(state.bestScores[packId] ?: 0, pct)),
            packProgress = state.packProgress + (packId to pct),
        )
        save()
        return addXp(xpGained)
    }

    fun markDailyDone() {
        state = state.copy(dailyDone = epochDay())
        save()
    }

    private fun isDailyDone() = state.dailyDone == epochDay()

    private fun currentLevel(): Level {
        var cur = LEVELS.first()
        for (l in LEVELS) if (state.xp >= l.xp) cur = l
        return cur
    }

    private fun nextLevel(): Level? = LEVELS.firstOrNull { it.xp > state.xp }

    private fun view(): GamificationView {
        val cur = currentLevel()
        val nxt = nextLevel()
        val span = if (nxt != null) nxt.xp - cur.xp else 1
        val into = state.xp - cur.xp
        return GamificationView(
            xp = state.xp,
            streak = state.streak,
            level = cur.lvl,
            title = cur.title,
            progress = if (nxt != null) (into.toFloat() / span).coerceIn(0f, 1f) else 1f,
            toNext = nxt?.let { it.xp - state.xp } ?: 0,
            bestScores = state.bestScores,
            packProgress = state.packProgress,
            dailyDone = isDailyDone(),
        )
    }

    data class LevelUp(val leveledUp: Boolean, val level: Int)
}
