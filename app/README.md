# Fight Club 2.0, Unified KMP App (Android + iOS)

Replaces the two legacy apps (Andromo Android + the Othonas Antoniou iOS app)
with **one** Kotlin Multiplatform / Compose Multiplatform codebase, backed by
the same `fc-api.peterdsp.dev` the web app uses. Liquid Glass on iOS, the
Material-3 "equivalent" on Android.

> Status: **scaffolded & building.** Shared Compose UI + logic, both platform
> audio actuals and the glass layer are implemented and verified — the Android
> debug APK assembles and the iOS app builds and runs on the simulator against
> the live `fc-api.peterdsp.dev` (episodes, schedule, quizzes).

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

Everything (episodes, streaming links, news, FC Legacy, quizzes, about) is fetched
from `fc-api`, which a daily scheduler keeps fresh — so the apps are fully
**backend-driven** and update on their own with no release.

The XP / streak / level model in `store/Gamification.kt` mirrors
`web/js/gamification.js` exactly (same level thresholds from `LEVELS`). Quiz
packs are fetched from `GET /quizzes`, so adding a question server-side updates
web, Android, and iOS at once.

## Offline & downloads

- `AudioPlayer.download(episodeId)` → Android `DownloadManager` / iOS
  `URLSession` background download, hitting `GET /download/:id`.
- Downloaded files cached locally; the UI shows a "downloaded" badge and plays
  from disk when offline (matches the legacy iOS app's offline feature).

## Build / run

Prereqs: JDK 17, the Android SDK (set `app/local.properties` → `sdk.dir=...`),
Xcode 16+, and [XcodeGen](https://github.com/yonaskolb/XcodeGen) for the iOS
project (`brew install xcodegen`).

```bash
# Android — assemble or install the debug build
./gradlew :composeApp:assembleDebug
./gradlew :composeApp:installDebug

# iOS — generate the Xcode project, then build/run
cd iosApp && xcodegen generate && open iosApp.xcodeproj
# …or headless for the simulator:
xcodebuild -project iosApp.xcodeproj -scheme iosApp \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

The Xcode project is generated from `iosApp/project.yml` (kept out of git); its
**Compile Kotlin Framework** phase runs `:composeApp:embedAndSignAppleFrameworkForXcode`
to build `ComposeApp.framework` before linking.

## What's implemented

- `commonMain` — `model/` (mirrors `api/data` JSON), `data/FcApi` (Ktor client
  for `/episodes /quizzes /legacy /news /schedule` + the `/onair-message`
  relay), `store/Gamification` (XP/streak/levels, identical thresholds to
  `web/js/gamification.js`), the `AudioController` contract, `GlassTokens` +
  `GlassSurface` (expect), and the Compose UI driven by `FcViewModel`: home
  (HUD, live bar, hero), episode rail, timed quiz flow (single-coroutine state
  machine, speed-bonus scoring), News rail, FC Legacy segments with a detail
  overlay, the 25-year History timeline, and a persistent now-playing dock with
  a live progress scrubber.
- `androidMain` — Media3/ExoPlayer `AudioController`, the RenderEffect-ready
  glass actual, `MainActivity`, manifest + adaptive launcher icon.
- `iosMain` — AVPlayer/AVAudioSession `AudioController` (background audio), the
  glass actual, `MainViewController` (`ComposeUIViewController`).
- `iosApp` — SwiftUI host embedding the Compose VC behind an
  `UIVisualEffectView` frosted backdrop.

## Next polish (optional)

1. Foreground `MediaSession` (Android) + Now Playing / remote commands (iOS).
2. CarPlay (iOS) / Android Auto media browsers.
3. Offline downloads via `DownloadManager` / `URLSession` background tasks.
4. Swap the Android glass for the `haze` library for a true backdrop blur.
