package dev.peterdsp.fc2

import android.content.Context
import com.russhwolf.settings.SharedPreferencesSettings
import dev.peterdsp.fc2.audio.AndroidAudioController
import dev.peterdsp.fc2.data.FcApi
import dev.peterdsp.fc2.store.Gamification

/** Build the shared graph with Android-backed Settings + ExoPlayer audio. */
fun androidAppDependencies(context: Context): AppDependencies {
    val settings = SharedPreferencesSettings(
        context.getSharedPreferences("fc2_prefs", Context.MODE_PRIVATE)
    )
    return AppDependencies(
        api = FcApi(),
        gamification = Gamification(settings),
        audio = AndroidAudioController(context),
    )
}
