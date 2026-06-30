@file:OptIn(ExperimentalForeignApi::class)

package dev.peterdsp.fc2.audio

import dev.peterdsp.fc2.model.Episode
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import platform.AVFAudio.AVAudioSession
import platform.AVFAudio.AVAudioSessionCategoryPlayback
import platform.AVFAudio.setActive
import platform.AVFoundation.AVPlayer
import platform.AVFoundation.AVPlayerItem
import platform.AVFoundation.AVPlayerTimeControlStatusPlaying
import platform.AVFoundation.currentItem
import platform.AVFoundation.currentTime
import platform.AVFoundation.duration
import platform.AVFoundation.pause
import platform.AVFoundation.play
import platform.AVFoundation.replaceCurrentItemWithPlayerItem
import platform.AVFoundation.seekToTime
import platform.AVFoundation.timeControlStatus
import platform.CoreMedia.CMTimeGetSeconds
import platform.CoreMedia.CMTimeMakeWithSeconds
import platform.Foundation.NSURL

/**
 * iOS audio via AVPlayer + AVAudioSession (Playback category) for background
 * audio and lockscreen controls. One player backs both the live stream and
 * on-demand episodes, matching the shared single-stream contract. The SwiftUI
 * host (iosApp) owns the Now Playing info / remote command center.
 */
class IosAudioController : AudioController {

    private val player = AVPlayer()
    private val _state = MutableStateFlow(PlaybackState())
    override val state: StateFlow<PlaybackState> = _state.asStateFlow()

    private var kind = PlaybackKind.NONE
    private var episode: Episode? = null

    init {
        val session = AVAudioSession.sharedInstance()
        runCatching {
            session.setCategory(AVAudioSessionCategoryPlayback, null)
            session.setActive(true, null)
        }
    }

    private fun push() {
        val dur = player.currentItem?.duration?.let { CMTimeGetSeconds(it) } ?: 0.0
        val pos = CMTimeGetSeconds(player.currentTime())
        _state.value = PlaybackState(
            kind = kind,
            episode = episode,
            isPlaying = player.timeControlStatus == AVPlayerTimeControlStatusPlaying,
            positionMs = (if (pos.isNaN()) 0.0 else pos * 1000.0).toLong(),
            durationMs = (if (dur.isNaN()) 0.0 else dur * 1000.0).toLong(),
        )
    }

    private fun load(url: String) {
        NSURL.URLWithString(url)?.let { player.replaceCurrentItemWithPlayerItem(AVPlayerItem(it)) }
        player.play()
        push()
    }

    override fun playLive(streamUrl: String) {
        kind = PlaybackKind.LIVE; episode = null; load(streamUrl)
    }

    override fun playEpisode(episode: Episode, streamUrl: String) {
        kind = PlaybackKind.EPISODE; this.episode = episode; load(streamUrl)
    }

    override fun pause() { player.pause(); push() }
    override fun resume() { player.play(); push() }

    override fun seekTo(positionMs: Long) {
        player.seekToTime(CMTimeMakeWithSeconds(positionMs / 1000.0, 1000))
        push()
    }

    override fun release() { player.pause() }
    override fun refreshProgress() { push() }
}
