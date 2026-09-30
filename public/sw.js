// Service worker do VoltMap: permite instalar o app e abrir as telas mesmo com internet instável.
// Estratégia "rede primeiro": sempre busca a versão mais nova e usa o cache só se estiver sem conexão.
const CACHE = 'voltmap-v1';
const ARQUIVOS = [
  '/', '/index.html', '/login.html', '/cadastro.html', '/ponto.html', '/novo-ponto.html',
  '/css/estilo.css', '/js/api.js', '/js/mapa.js', '/js/login.js', '/js/cadastro.js',
  '/js/ponto.js', '/js/novo-ponto.js', '/vendor/leaflet/leaflet.css', '/vendor/leaflet/leaflet.js',
  '/icons/icon-192.png', '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Dados da API e serviços externos (mapa, endereços) vão sempre direto para a rede
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
