# Source content, fightclub.gr + app stores

Captured for Fight Club 2.0. Drives the web app copy, the quiz bank, and the
episode/segment models.

## ⚠️ Scraper note
You asked for **Firecrawl + Apify/Ampify**, neither MCP is connected in this
session, so I scraped with the built-in fetcher (`WebFetch`). For a **full
archive crawl** (every episode page → title, date, and the actual `.mp3` URL,
so `ingest.js` can pull real files), the **Bright Data** plugin *is* available
here (`/scrape`, `/data-feeds`, `/search` skills). Say the word and I'll crawl
the whole `fightclub.gr` archive into `api/data/episodes.json` with real media
links.

## 📻 Full history (from lifo.gr, e-tetradio, sport-fm.gr, luben.tv)
- **First aired 29 Oct 2001** on **ΕΡΑ Σπορ**. Named after the Brad Pitt / Edward Norton film
  → "Radio Project Mayhem". Original trio: Τσαούσης, Βαϊμάκης + actor **Παύλος Κοντογιαννίδης**.
  Created under ΕΡΑ Σπορ director Νίκος Ασημακόπουλος.
- **2005**: moved ("μεταγραφή") to the then **SuperΣΠΟΡ FM 94.6** via **Γιώργος Χελάκης**, took
  its current form there.
- **Μάκης Παπασημακόπουλος** joined, phoning in as agent-scout **"Mac Pappas"** and refereeing
  professor **"Σλόμπονταν Νουγκατίνοβιτς"**.
- **2008**: the site **fightclub.gr** launches (archive, best-of, the Φαϊτκλαμποελληνικό λεξικό).
- **Jul 2013**: duo splits temporarily (Τσαούσης → Ιωάννινα/"Omerta"; Βαϊμάκης → ΣΚΑΪ 100.3
  "Good Ol' Boys"). **2016**: reunion for Σπορ FM 94.6's 20 years (Jun), official return (Sep).
- **2026**: **#1 in the late-night slot**, 9.5% (22–23h) & 12.1% (23–24h), "almost unbeatable".
- Listener segments: τριλήμματα, παραληρήματα, πονήματα, μεγάλες αλήθειες, "υπάρχουν δύο/τριών
  ειδών άνθρωποι", μουσαντέ, "Αν ο Γκόντζος ήταν…", "με τιμά που…", "φωνή 4". Last half-hour = listeners.
- Tradition: **live Eurovision commentary** with ΕΡΤ. YouTube: 35 videos 2019–2021. Socials:
  FB 20k+, IG 6k+, YouTube 8k+ subs. Βαϊμάκης = the listeners' "γκουρού του έρωτα".

## ⚠️ Spotify link discrepancy
The Spotify show URL provided (`open.spotify.com/show/0NXLDx29nN2shi0HT5kvle`) resolves to
**"Στάθης Θεοχάρης - Tribute Collection"**, NOT the Fight Club / bwinΣΠΟΡ ON DEMAND podcast, so it
was **not embedded** (would show wrong content). The real on-demand is at sport-fm.gr/radio/on-demand
and **Apple Podcasts id 1522372434** ("bwinΣΠΟΡ FM ON DEMAND"). Its episode player is a tokenised
SKAI podcast-widget iframe (no clean raw mp3), so the no-login path in the app is **self-hosted
`fc-api`** + outbound links. _If you have the correct Spotify show URL, drop it in and I'll embed it._

## The show
- **Fight Club**, Greek sports/culture radio show, **since 2001**.
- Station: **Σπορ FM 94.6**, daily **22:00–00:00**.
- Hosts (per App Store listing): **Κώστας Βαϊμάκης** & **Γιάννης Τσαούσης**.
- Tagline: **«Η εκπομπή όπου τα μαθαίνετε όλα τελευταίοι»**.
- Site built by Netway. Socials: Facebook, Twitter, Instagram, YouTube.

## Site sections
- **RADIO**, Αρχείο Εκπομπών, Θεματικές Εκπομπές, Μουσικά Αφιερώματα, Best of,
  Μεγάλες Στιγμές, Mac Pappas, FightClub OST.
- **YOUTUBE**, top-10 lists, curated collections.
- **FC LEGACY**, Φαϊτκλαμποελληνικό Λεξικό, «Αν ο Γκόντζος ήταν…», Μεγάλες
  Αλήθειες, Μιλάει ο Λαός, Μουσαντέ, Παραληρήματα, Τριλήμματα.
- **ΚΑΖΑΜΙΕΣ**, annual awards, archive **2003–2026**.

## Recent episodes (June 2026 examples, used as seed)
- Κόντρα στους Κουνελοκέφαλους, Μουντιάλ προθέρμανση, προγνωστικά.
- Η Υπόθεση Κωνσταντέλια, εθνική, μπασκετικές μεταγραφές.
- Η Εξέλιξη του Αθλήματος, ιστορία, κανόνες.
- Ο Πρώτος Σκόρερ, Μέσι, ρεκόρ.
- Πνευματικά Δικαιώματα, remixes, διεθνή.

## Legacy apps (being replaced by the unified KMP app)
- **iOS**, "Fight Club 2.0", dev **Othonas Antoniou**, Entertainment, free,
  v1.8.4 (Mar 2025), iOS 15.6+, 20.3 MB, 5.0★ (19). Features: live stream,
  archived episodes, **offline download**, seek, music playlists, YouTube/IG
  links, **CarPlay** (since 1.8.4), no data collection.
- **Android**, Andromo-built (`com.andromo.dev192173.app579970`). Play listing
  fetch was truncated; same feature set assumed. Re-scrape with Bright Data if a
  full Android description is needed.

→ All of the above feeds `web/js/data.js` and `api/data/{episodes,quizzes}.json`.
