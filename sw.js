// GunBase 火械基地 — Service Worker (offline app shell)
var CACHE = "gunbase-v16";
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
  "js/other-products.js",
  "js/app.js",
  "js/admin.js",
  "libs/xlsx.full.min.js",
  "assets/logo-white.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/icon-maskable-512.png",
  "images/GB-OTH-001.jpg",
  "images/GB-OTH-001-2.jpg",
  "images/GB-OTH-001-3.jpg",
  "images/GB-CAT-IMG-01.jpg",
  "images/GB-CAT-IMG-02.jpg",
  "images/GB-CAT-IMG-03.jpg",
  "images/GB-CAT-IMG-04.jpg",
  "images/GB-CAT-IMG-05.jpg",
  "images/GB-CAT-IMG-06.jpg",
  "images/GB-CAT-IMG-07.jpg",
  "images/GB-CAT-IMG-08.jpg",
  "images/GB-CAT-IMG-09.jpg",
  "images/GB-CAT-IMG-10.jpg",
  "images/GB-CAT-IMG-11.jpg",
  "images/GB-CAT-IMG-12.jpg",
  "images/GB-CAT-IMG-13.jpg",
  "images/GB-CAT-IMG-14.jpg",
  "manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  // Add shell files one by one: one missing asset must not abort the whole install.
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
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
      }).catch(function () {
        // Handing an HTML document to an <img> produces a broken-image box.
        if (e.request.destination === "image" || /\.(png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)) {
          return new Response("", { status: 404, statusText: "image unavailable" });
        }
        return caches.match("./");
      });
    })
  );
});
