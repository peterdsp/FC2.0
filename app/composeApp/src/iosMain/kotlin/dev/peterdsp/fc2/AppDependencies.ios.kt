package dev.peterdsp.fc2

import com.russhwolf.settings.NSUserDefaultsSettings
import dev.peterdsp.fc2.audio.IosAudioController
import dev.peterdsp.fc2.data.FcApi
import dev.peterdsp.fc2.store.Gamification
import platform.Foundation.NSUserDefaults

/** Build the shared graph with NSUserDefaults-backed Settings + AVPlayer audio. */
fun iosAppDependencies(): AppDependencies = AppDependencies(
    api = FcApi(),
    gamification = Gamification(NSUserDefaultsSettings(NSUserDefaults.standardUserDefaults)),
    audio = IosAudioController(),
)
