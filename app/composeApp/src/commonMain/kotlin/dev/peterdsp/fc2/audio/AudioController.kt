package dev.peterdsp.fc2.audio

import dev.peterdsp.fc2.model.Episode
import kotlinx.coroutines.flow.StateFlow

/** What the dock and live bar are bound to. */
enum class PlaybackKind { NONE, LIVE, EPISODE }

data class PlaybackState(
    val kind: PlaybackKind = PlaybackKind.NONE,
    val episode: Episode? = null,
    val isPlaying: Boolean = false,
    val positionMs: Long = 0,
    val durationMs: Long = 0,
)

/**
 * One controller drives both the 24/7 live radio and on-demand episodes, so
 * only one thing ever plays and audio survives navigation — the same contract
 * the web `player.js` keeps with its single `<audio>` element. Platform actuals
 * use Media3/ExoPlayer (Android) and AVPlayer/AVAudioSession (iOS) for
 * background playback and lockscreen controls.
 */
interface AudioController {
    val state: StateFlow<PlaybackState>

    fun playLive(streamUrl: String)
    fun playEpisode(episode: Episode, streamUrl: String)
    fun pause()
    fun resume()
    fun seekTo(positionMs: Long)
    fun release()

    /** Re-emit the current position/duration. Called on a timer while playing so
     *  the scrubber advances (players only push on discrete state changes). */
    fun refreshProgress()
}
