const CACHE = "hawae-md-v4";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = ["/manifest.webmanifest", "/logo.jpeg", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always request current Next.js HTML. Stale HTML points to removed hashed CSS/JS chunks.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match(OFFLINE_URL).catch(() => undefined)) ||
        new Response("Connexion indisponible. Vérifiez votre connexion puis réessayez.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      ),
    );
    return;
  }

  // Only public assets belong in this cache. Dossier data and route prefetches use the network.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  if (!STATIC_ASSETS.includes(url.pathname)) return;

  // Network-first for the public PWA resources precached on install.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || new Response(null, { status: 503 })),
  );
});
