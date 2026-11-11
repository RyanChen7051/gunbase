// GunBase 火械基地 — Service Worker (offline app shell)
var CACHE = "gunbase-v3";
var SHELL = [
  "./",
  "index.html",
  "admin.html",
  "css/style.css",
  "js/config.js",
  "js/i18n.js",
  "js/products.js",
  "js/coming-soon.js",
  "js/scope-switch.js",
  "js/app.js",
  "js/admin.js",
  "libs/xlsx.full.min.js",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/icon-maskable-512.png",
  "manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  // products.js: network-first so catalog updates go live after redeploy
  if (url.pathname.indexOf("products.js") !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }
  // everything else: cache-first, fall back to network
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        if (res.ok && (url.origin === location.origin)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return caches.match("./"); });
    })
  );
});
