/* Maturitní deska – service worker (offline režim a instalace na plochu)
   Verze 24.11.2026 12:57 · generuje zdroj/build/build.py, needitovat v kořeni repa.
   - stránka: nejdřív síť (ať je vždy nejnovější), bez signálu poslední uložená kopie
   - obrázky, písma, ikony: mají v názvu otisk obsahu, takže stačí uložit jednou
   - PDF: nejdřív síť, ale každé otevřené PDF se uloží a bez signálu jde i offline
   - videa, version.json a cizí servery (AI, žebříček) jdou vždy rovnou na síť */
const VERSION = '24.11.2026 12:57';
const PAGE = 'md-page', STATIC = 'md-static', MEDIA = 'md-media';
const CORE = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'].concat(["fonts/ChakraPetch-500-latin-ext.woff2", "fonts/ChakraPetch-500-latin.woff2", "fonts/ChakraPetch-600-latin-ext.woff2", "fonts/ChakraPetch-600-latin.woff2", "fonts/ChakraPetch-700-latin-ext.woff2", "fonts/ChakraPetch-700-latin.woff2", "fonts/IBMPlexMono-400-latin-ext.woff2", "fonts/IBMPlexMono-400-latin.woff2", "fonts/IBMPlexMono-500-latin-ext.woff2", "fonts/IBMPlexMono-500-latin.woff2", "fonts/IBMPlexMono-600-latin-ext.woff2", "fonts/IBMPlexMono-600-latin.woff2", "fonts/IBMPlexSans-400-latin-ext.woff2", "fonts/IBMPlexSans-400-latin.woff2", "fonts/IBMPlexSans-500-latin-ext.woff2", "fonts/IBMPlexSans-500-latin.woff2", "fonts/IBMPlexSans-600-latin-ext.woff2", "fonts/IBMPlexSans-600-latin.woff2"]);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const page = await caches.open(PAGE);
    try { await page.add(new Request('./', {cache: 'reload'})); } catch (err) {}
    const st = await caches.open(STATIC);
    await Promise.all(CORE.map(u => st.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = [PAGE, STATIC, MEDIA];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  const p = u.pathname;
  if (/\/videa\//.test(p) || /version\.json$/.test(p) || /sw\.js$/.test(p)) return;
  const scope = new URL(self.registration.scope).pathname;
  // stránka hry (i s ?v=… po aktualizaci) – PDF otevřené v nové záložce je taky „navigace“, proto podle cesty
  if (p === scope || p === scope + 'index.html') {
    e.respondWith((async () => {
      try {
        const res = await fetch(r);
        if (res.ok) { const copy = res.clone(); caches.open(PAGE).then(c => c.put('./', copy)); }
        return res;
      } catch (err) {
        return (await caches.match('./', {cacheName: PAGE})) || Response.error();
      }
    })());
    return;
  }
  // PDF: nejdřív síť (ať se oprava podkladů hned projeví), bez signálu uložená kopie
  if (/\/materialy\//.test(p)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(r);
        if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(MEDIA).then(c => c.put(u.pathname, copy)); }
        return res;
      } catch (err) {
        return (await caches.match(u.pathname, {cacheName: MEDIA})) || Response.error();
      }
    })());
    return;
  }
  // obrázky, písma, ikony – v názvu mají otisk obsahu, stačí je stáhnout jednou
  e.respondWith((async () => {
    const hit = await caches.match(r, {ignoreSearch: true});
    if (hit) return hit;
    const res = await fetch(r);
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(STATIC).then(c => c.put(r, copy)); }
    return res;
  })());
});
