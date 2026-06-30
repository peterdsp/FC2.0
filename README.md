<div align="center">

# 📻 Ραμαγιά

### _Η εκπομπή όπου τα μαθαίνετε όλα τελευταίοι._

</div>

> [!IMPORTANT]
> **This is a fun, unofficial fan project — a tribute to the late-night _Fight Club_
> sports & culture radio show, made by a listener out of pure love for it.**
>
> It is **non-commercial** and has **no affiliation with, and no endorsement from,**
> the show, its hosts, or any radio station. **All names, audio, artwork, schedule,
> branding and likenesses belong to their respective owners** — this project claims
> **no ownership** of any of it. If a rights holder ever wants something changed or
> taken down, that request is honored immediately, no questions asked.

A little love letter to 25 years of the show: live radio, the episode archive, a few
quizzes built from its lore, and the "FC Legacy" bits — wrapped in a fast, premium
Liquid Glass interface on web, iOS and Android.

## 🗂 What's in here

```
web/   Liquid Glass PWA (installable, offline app-shell)
api/   the backend (Node/Express): catalog, range audio streaming, quizzes,
       schedule, FC Legacy, news + a daily scraper that keeps it all fresh
app/   one Kotlin Multiplatform app (iOS + Android), Compose UI, fully API-driven
```

The apps are **backend-driven**: everything (episodes, streaming links, news, lore)
comes from the API, so they stay up to date on their own.

## 🚀 Run it

```bash
# Web
cd web && python3 -m http.server 4173      # http://localhost:4173

# Backend
cd api && npm install && npm start         # http://localhost:8080/health
npm run refresh                            # pull fresh content on demand

# Apps
cd app && ./gradlew :composeApp:assembleDebug      # Android
cd app/iosApp && xcodegen generate && open iosApp.xcodeproj   # iOS
```

Deployment details are environment-specific and kept out of this repo.

## 📄 License

Application **code** is MIT. **The show's content is © its respective owners and is
not licensed by this project** — see the note above. Made with respect, just for fun. ❤️
