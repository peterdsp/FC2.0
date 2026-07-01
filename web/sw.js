/**
 * Fight Club 2.0, service worker.
 * App-shell precache + runtime strategies so the PWA opens instantly and
 * survives a flaky connection. Audio streams are never cached (range +
 * bandwidth), API reads are network-first with a cached fallback.
 */
const VERSION = "fc2-v9";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

// The app shell, everything needed to render the UI offline-of-backend.
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/liquid-glass.css",
  "./styles/app.css",
  "./js/app.js",
  "./js/data.js",
  "./js/gamification.js",
  "./js/quiz.js",
  "./js/player.js",
  "./js/live.js",
  "./js/messages.js",
  "./js/schedule.js",
  "./js/eras.js",
  "./js/stickers.js",
  "./js/ui.js",
  "./assets/fonts/SFProDisplay-Regular.woff2",
  "./assets/fonts/SFProDisplay-Medium.woff2",
  "./assets/fonts/SFProDisplay-Bold.woff2",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isAudio = (url) =>
  /\/(stream|download)\//.test(url.pathname) ||
  /sportfm|live24/.test(url.hostname) ||
  /\.(mp3|m4a|aac|ogg|opus|webm)$/i.test(url.pathname);

const isApi = (url) =>
  url.hostname.startsWith("fc-api.") ||
  /\/(episodes|quizzes|legacy|news|eras|schedule|messages)(\b|\/)/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never intercept audio, let the browser stream with native range support.
  if (isAudio(url)) return;

  // API: network-first, fall back to the last good cached response offline.
  if (isApi(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin shell / static: cache-first, then fill the cache on miss.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }
});
