package dev.peterdsp.fc2.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.peterdsp.fc2.AppDependencies
import dev.peterdsp.fc2.model.Episode
import dev.peterdsp.fc2.model.LegacySegment
import dev.peterdsp.fc2.model.NewsItem
import dev.peterdsp.fc2.model.NowOnAir
import dev.peterdsp.fc2.model.QuizPack
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeState(
    val episodes: List<Episode> = emptyList(),
    val quizzes: List<QuizPack> = emptyList(),
    val news: List<NewsItem> = emptyList(),
    val legacy: List<LegacySegment> = emptyList(),
    val nowOnAir: NowOnAir = NowOnAir(),
    val loading: Boolean = true,
)

/** 25 years on the FM dial — mirrors `web/js/data.js` HISTORY. */
data class HistoryEntry(val year: String, val text: String)

val HISTORY = listOf(
    HistoryEntry("2001", "Πρώτη εκπομπή στις 29 Οκτωβρίου, στην ΕΡΑ Σπορ. Παρουσιαστές: Τσαούσης, Βαϊμάκης & ο ηθοποιός Παύλος Κοντογιαννίδης."),
    HistoryEntry("2005", "«Μεταγραφή» σε νέο σταθμό με τη συμβολή του Γιώργου Χελάκη — εκεί η εκπομπή απογειώνεται."),
    HistoryEntry("2008", "Γεννιέται το αρχείο της εκπομπής στο διαδίκτυο: επεισόδια, best of και το «Φαϊτκλαμποελληνικό λεξικό»."),
    HistoryEntry("2013", "Το δίδυμο «σπάει» προσωρινά τον Ιούλιο, Τσαούσης στα Ιωάννινα, Βαϊμάκης σε άλλον σταθμό."),
    HistoryEntry("2016", "Reunion για τα 20 χρόνια (Ιούνιος) και επίσημη επανένωση τον Σεπτέμβριο."),
    HistoryEntry("2026", "#1 σε ακροαματικότητα στη βραδινή ζώνη (9,5%–12,1% στις ώρες της). Σχεδόν «ανίκητο»."),
)

/**
 * Home screen state holder. Fetches the catalog from fc-api and exposes the
 * gamification view + playback state straight from the shared stores.
 */
class FcViewModel(private val deps: AppDependencies) : ViewModel() {

    private val _home = MutableStateFlow(HomeState())
    val home: StateFlow<HomeState> = _home.asStateFlow()

    val gamification = deps.gamification.view
    val playback = deps.audio.state

    init {
        refresh()
        // Advance the now-playing scrubber while audio is playing.
        viewModelScope.launch {
            while (true) {
                if (playback.value.isPlaying) deps.audio.refreshProgress()
                delay(500)
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val episodes = deps.api.episodes()
                .sortedWith(compareByDescending<Episode> { it.file != null }.thenByDescending { it.date })
            val quizzes = deps.api.quizzes()
            val news = deps.api.news()
            val legacy = deps.api.legacy()
            val now = deps.api.schedule()?.now ?: NowOnAir()
            _home.value = HomeState(
                episodes = episodes,
                quizzes = quizzes,
                news = news,
                legacy = legacy,
                nowOnAir = now,
                loading = false,
            )
        }
    }

    /* ---- playback ---- */
    fun toggleLive() {
        val s = playback.value
        if (s.kind == dev.peterdsp.fc2.audio.PlaybackKind.LIVE && s.isPlaying) deps.audio.pause()
        else deps.audio.playLive(deps.liveStreamUrl)
    }

    fun playEpisode(ep: Episode) =
        deps.audio.playEpisode(ep, deps.api.streamUrl(ep.id))

    fun togglePlay() {
        if (playback.value.isPlaying) deps.audio.pause() else deps.audio.resume()
    }

    fun seekTo(ms: Long) = deps.audio.seekTo(ms)

    /* ---- gamification passthrough ---- */
    fun touchStreak() = deps.gamification.touchStreak()
    fun recordQuiz(packId: String, correct: Int, total: Int, xp: Int) =
        deps.gamification.recordQuiz(packId, correct, total, xp)
    fun markDailyDone() = deps.gamification.markDailyDone()

    /* ---- messages ---- */
    fun sendOnAir(name: String, text: String, onResult: (Boolean) -> Unit) {
        viewModelScope.launch { onResult(deps.api.sendOnAir(name, text)) }
    }

    override fun onCleared() = deps.audio.release()
}
