const CACHE = "marco-locked-in-v9";

const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => null)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;

  const isNavigate = event.request.mode === "navigate";
  const isHashedAsset = url.pathname.includes("/assets/");

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request, isNavigate ? { cache: "no-store" } : undefined);
        if (response.ok) {
          if (isNavigate) {
            await cache.put("./index.html", response.clone());
          } else if (isHashedAsset) {
            await cache.put(event.request, response.clone());
          }
        }
        return response;
      } catch {
        if (isNavigate) {
          return (
            (await cache.match("./index.html")) ||
            (await cache.match("/index.html")) ||
            (await cache.match("./")) ||
            (await cache.match(event.request)) ||
            Response.error()
          );
        }
        const cached = await cache.match(event.request);
        if (cached) return cached;
        return Response.error();
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "./index.html#today";
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch {
              /* ignore */
            }
          }
          return;
        }
      }
      if (clients.openWindow) await clients.openWindow(target);
    })()
  );
});
