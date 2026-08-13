// v20260813.7 — bump to bust cache
const CACHE='soiree-hq-v20260813.7';
const ASSETS=['./','./index.html','./manifest.json','./css/app.css',
  './js/data.js','./js/storage.js','./js/finances.js','./js/todo.js',
  './js/inventory.js','./js/authors_hq.js','./js/eventday.js','./js/app.js',
  './icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>{const n=fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(ch=>ch.put(e.request,r.clone()));return r;}).catch(()=>c);return c||n;}));});
