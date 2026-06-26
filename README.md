<div align="center">

# ⚔️ FIGHT CLUB 2.0

### _Η εκπομπή που τα μαθαίνετε όλα τελευταίοι._

An **unofficial, fan made** tribute to **Fight Club**, the late night sports & culture
radio show on **bwinΣΠΟΡ FM 94.6**. Reimagined as an ultralight, ultra responsive
Liquid Glass app: live radio, the archive, quizzes, and 25 years of lore.

</div>

> [!IMPORTANT]
> ### Copyright & ownership
> **All content, names, audio, branding, schedule and likenesses belong to Fight Club,
> its hosts (Γιάννης Τσαούσης, Κώστας Βαϊμάκης), and bwinΣΠΟΡ FM 94.6 / their rights
> holders.** This project claims **no ownership** of any of it. It is a non commercial,
> fan made tribute by a listener, built out of respect for the show. No affiliation with
> or endorsement by the station is implied. If a rights holder wants it changed or taken
> down, that request is honored immediately.

## ✨ Features

- **📻 Live 24/7 radio** with one tap, plus the show currently on air from the daily schedule.
- **🎧 Archive** browse, stream and download, organised by year, month and **era** (Euro 2004/2008/2024, World Cups, Champions League, big events).
- **🧠 Quizzes** built from the show's real 25 year history. XP, levels, daily streaks.
- **💬 Messages** send a shout to the show, in app.
- **🪟 Liquid Glass** white led, with red accent and green accent used equally. SF Pro Display. No frameworks, no external fonts.

## 🗂 Structure

```
web/   Liquid Glass PWA (the live site)
api/   fc-api: archive catalog, quizzes, schedule, messages (Node/Express)
app/   Unified Kotlin Multiplatform app spec (iOS + Android)
```

## 🚀 Run locally

```bash
cd web && python3 -m http.server 4173   # http://localhost:4173
```

The live radio works offline-of-backend. The episode archive needs `fc-api` running.

## 📦 fc-api

```bash
cd api && npm install && npm start       # http://localhost:8080/health
```

Serves the catalog, range-based audio streaming, downloads, the schedule, eras and a
message wall. Deployment is environment specific and kept out of this repo.

## 📄 License

Code: MIT (the application code only). **Show content is © its respective owners and is
not licensed by this project.** See the copyright note above.
