// App-shell offline notice only. Never caches API, auth, or messages.
const CACHE = "kemis-shell-v4-amharic-default";
const SHELL = ["offline.html", "logo.svg", "icon-192.png", "fonts/noto-sans-ethiopic-subset.woff2"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((p) => new URL(p, self.registration.scope).href))));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("kemis-shell-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/api/") || url.pathname.includes("clerk")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(new URL("offline.html", self.registration.scope).href)));
    return;
  }
  if (SHELL.some((p) => url.href === new URL(p, self.registration.scope).href)) {
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  }
});
