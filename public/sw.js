// ModeQuest service worker: saves data by keeping the game's files on the
// device, and lets the game open without a connection once it has loaded.
// Never caches API calls, payments or invite links.
const VERSION = "mq-v2";
/** Keep at most this many build files; each update adds new ones. */
const MAX_STATIC = 120;

async function trim(cache) {
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_STATIC))) await cache.delete(k);
}
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add("/")).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Paystack, fonts CDN: straight to network
  if (/^\/(api|pay|invite|teacher)(\/|$)/.test(url.pathname)) return;

  // Pages: always try the network first (so updates arrive), fall back to the saved copy offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname === "/") caches.open(PAGES).then((c) => c.put("/", res.clone()));
          return res;
        })
        .catch(() => caches.match("/", { cacheName: PAGES }).then((r) => r || Response.error())),
    );
    return;
  }

  // Build files have unique names, so a saved copy is always correct: use it and skip the download.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.open(STATIC).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) c.put(req, res.clone()).then(() => trim(c));
              return res;
            }),
        ),
      ),
    );
  }
});
