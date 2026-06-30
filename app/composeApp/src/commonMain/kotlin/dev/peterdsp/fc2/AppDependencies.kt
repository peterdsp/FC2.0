package dev.peterdsp.fc2

import dev.peterdsp.fc2.audio.AudioController
import dev.peterdsp.fc2.data.FcApi
import dev.peterdsp.fc2.store.Gamification

/**
 * The shared object graph. Built once per platform entry point — Android's
 * `androidAppDependencies(context)` / iOS's `iosAppDependencies()` — and handed
 * to [App], keeping the composables free of platform construction details.
 */
class AppDependencies(
    val api: FcApi,
    val gamification: Gamification,
    val audio: AudioController,
    val liveStreamUrl: String = FcApi.LIVE_STREAM,
)
