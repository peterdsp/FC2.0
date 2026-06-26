# Fight Club 2.0, Unified KMP App (Android + iOS)

Replaces the two legacy apps (Andromo Android + the Othonas Antoniou iOS app)
with **one** Kotlin Multiplatform / Compose Multiplatform codebase, backed by
the same `fc-api.peterdsp.dev` the web app uses. Liquid Glass on iOS, the
Material-3 "equivalent" on Android.

> Status: **architecture + scaffold spec** (ready to `init`). The web app and
> API in the sibling folders are already built and verified; this is the
> blueprint to build the native app on top of the same backend.

---

## Why KMP / Compose Multiplatform

- **One codebase, two stores.** Shared UI (Compose), shared business logic,
  shared networking + the *same* episode/quiz models as the API.
- **Native where it matters.** iOS gets true Liquid Glass via SwiftUI interop
  (`UIVisualEffectView` / iOS 26 `Glass` APIs); Android gets the closest
  equivalent (blur + dynamic color) without forking the app.
- **Audio done right.** Platform media players behind one shared interface, so
  background playback, lockscreen controls, CarPlay/Android Auto, and offline
  downloads all work natively.

## Module layout

```
app/
├── composeApp/                  # shared Compose Multiplatform UI + logic
│   ├── commonMain/
│   │   ├── data/                # FcApi (Ktor client) → /episodes /quizzes /stream
│   │   ├── model/               # Episode, QuizPack, Question  (mirror api/data/*.json)
│   │   ├── audio/AudioPlayer.kt # expect interface (play/seek/download/state)
│   │   ├── store/               # Gamification: XP, streak, levels (multiplatform-settings)
│   │   └── ui/                  # HomeScreen, EpisodeRail, QuizFlow, NowPlayingDock
│   ├── androidMain/             # actual AudioPlayer (Media3/ExoPlayer), DownloadManager
│   └── iosMain/                 # actual AudioPlayer (AVPlayer), background audio
├── iosApp/                      # SwiftUI host, Liquid Glass chrome, AVAudioSession, CarPlay
└── gradle/ + settings.gradle.kts + build.gradle.kts
```

## Key dependencies

| Concern        | Library |
|----------------|---------|
| UI             | Compose Multiplatform (`org.jetbrains.compose`) |
| Navigation     | `androidx.navigation:navigation-compose` (multiplatform) |
| Networking     | Ktor client (`ktor-client-core` + `okhttp`/`darwin` engines) |
| JSON           | `kotlinx.serialization` (same field names as `api/data/*.json`) |
| Persistence    | `multiplatform-settings` (XP/streak), `androidx.room` KMP (offline cache) |
| Android audio  | `androidx.media3:media3-exoplayer` + `media3-session` |
| iOS audio      | `AVPlayer` + `AVAudioSession` (background mode) via `iosMain` actual |
| Image/blur     | `coil3` (multiplatform) |

## The "Liquid Glass" layer (the design hook)

`expect fun GlassSurface(modifier, content)` with platform `actual`s:

- **iOS (`iosMain` / `iosApp`)**, wrap content in a SwiftUI
  `.background(.ultraThinMaterial)` / iOS 26 `glassEffect()` via
  `UIKitView` interop. Specular highlight + refraction match the web app's
  `liquid-glass.css`.
- **Android (`androidMain`)**, `Modifier.hazeChild()` (the *haze* library) or
  `RenderEffect.createBlurEffect()` (API 31+) for the frosted panel, plus a
  Material-3 dynamic-color tint and a subtle gradient stroke. This is the
  Android "equivalent of Liquid Glass."

Shared tokens (radii, tints, brand colors) come from one `GlassTokens` object so
both platforms, and the web app, stay visually identical.

## Shared addiction loop

The XP / streak / level model in `store/Gamification.kt` mirrors
`web/js/gamification.js` exactly (same level thresholds from `LEVELS`). Quiz
packs are fetched from `GET /quizzes`, so adding a question server-side updates
web, Android, and iOS at once.

## Offline & downloads

- `AudioPlayer.download(episodeId)` → Android `DownloadManager` / iOS
  `URLSession` background download, hitting `GET /download/:id`.
- Downloaded files cached locally; the UI shows a "downloaded" badge and plays
  from disk when offline (matches the legacy iOS app's offline feature).

## Build / run (once scaffolded)

```bash
# Android
./gradlew :composeApp:installDebug
# iOS  (open the SwiftUI host in Xcode)
open iosApp/iosApp.xcodeproj
```

## Next steps to stand it up

1. `kotlin-multiplatform-wizard` (or Android Studio "New KMP App") to generate
   the Gradle scaffold matching the layout above.
2. Drop in `model/` types from `../api/data/*.json`.
3. Implement `FcApi` against `https://fc-api.peterdsp.dev`.
4. Port `web/js/quiz.js` + `gamification.js` logic to `commonMain`.
5. Implement the two `AudioPlayer` actuals + the `GlassSurface` actuals.
6. Wire CarPlay (iOS) / Android Auto media sessions.
