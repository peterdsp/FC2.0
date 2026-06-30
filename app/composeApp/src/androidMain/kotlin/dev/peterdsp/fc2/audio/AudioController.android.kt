package dev.peterdsp.fc2.audio

import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import android.content.Context
import dev.peterdsp.fc2.model.Episode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Android audio via Media3/ExoPlayer. One player instance backs both the live
 * stream and on-demand episodes, so only one thing ever plays. ExoPlayer gives
 * us range-based streaming + a path to a foreground MediaSession (lockscreen /
 * Android Auto) when wired in the host app.
 */
class AndroidAudioController(context: Context) : AudioController {

    private val player = ExoPlayer.Builder(context).build()
    private val _state = MutableStateFlow(PlaybackState())
    override val state: StateFlow<PlaybackState> = _state.asStateFlow()

    init {
        player.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) = push()
            override fun onPlaybackStateChanged(playbackState: Int) = push()
            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) = push()
        })
    }

    private var kind = PlaybackKind.NONE
    private var episode: Episode? = null

    private fun push() {
        _state.value = PlaybackState(
            kind = kind,
            episode = episode,
            isPlaying = player.isPlaying,
            positionMs = player.currentPosition.coerceAtLeast(0),
            durationMs = player.duration.coerceAtLeast(0),
        )
    }

    override fun playLive(streamUrl: String) {
        kind = PlaybackKind.LIVE
        episode = null
        player.setMediaItem(MediaItem.fromUri(streamUrl))
        player.prepare()
        player.playWhenReady = true
        push()
    }

    override fun playEpisode(episode: Episode, streamUrl: String) {
        kind = PlaybackKind.EPISODE
        this.episode = episode
        player.setMediaItem(MediaItem.fromUri(streamUrl))
        player.prepare()
        player.playWhenReady = true
        push()
    }

    override fun pause() { player.pause() }
    override fun resume() { player.play() }
    override fun seekTo(positionMs: Long) { player.seekTo(positionMs); push() }
    override fun release() { player.release() }
    override fun refreshProgress() { push() }
}
