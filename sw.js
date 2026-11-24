const prefix = 'caderno-' + self.registration.scope + '-';
const cacheName = prefix + 'v2';
const shell = ['./','./index.html','./style.css','./app.js','./engine.mjs','./catalog.js','./topicos.js','./autorais.js','./oficiais.js','./materiais/edital.pdf','./materiais/anexo-ii.pdf','./app.webmanifest','./icon-192.png','./icon-512.png','./estante.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(cacheName).then(c => c.addAll(shell))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(k => k.startsWith(prefix) && k !== cacheName).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !shell.some(path => new URL(path, self.registration.scope).href === e.request.url)) return;
  e.respondWith(caches.open(cacheName).then(async c => (await c.match(e.request)) || fetch(e.request)));
});
