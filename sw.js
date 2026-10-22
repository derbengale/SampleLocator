// SampleScanner service worker: the app works without network. Pages: network first (a new build arrives at once),
// everything else: cache first. The cache name changes with every build, so old files are dropped.
const CACHE = "samplescanner-51b062a8a66b";
const SHELL = ["./", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put("./", copy));
          }
          return res;
        })
        .catch(() => caches.match("./"))
    );
  } else {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
