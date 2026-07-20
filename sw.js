// Buraco Master VIP — service worker (mínimo, REDE-PRIMEIRO).
// Objetivo: deixar o app instalável (PWA/casca da Play) SEM travar as atualizações.
// A gente prometeu: correção/novidade no site = na hora. Então NÃO servimos conteúdo
// velho do cache; sempre buscamos a rede. O cache só entra como rede de segurança
// (se a pessoa estiver sem internet, mostra a última versão que ela viu).
const CACHE = 'bmv-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                    // só GET
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;  // ignora ws://, etc.
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);                  // REDE primeiro (sempre o mais novo)
      if (fresh && fresh.status === 200 && url.origin === self.location.origin) {
        const c = await caches.open(CACHE); c.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);          // sem internet → última vista
      if (cached) return cached;
      throw err;
    }
  })());
});
