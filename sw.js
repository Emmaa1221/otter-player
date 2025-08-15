const SHELL=['/','/index.html','/style.css','/player.js','/manifest.webmanifest','/assets/icon-192.png','/assets/icon-512.png','/assets/words_3000.json'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open('otter-shell').then(c=>c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch',e=>{
  const req=e.request; const url=new URL(req.url);
  if(url.origin===location.origin && (/\.(css|js|png|webmanifest|json)$/.test(url.pathname) || url.pathname.endsWith('/'))){
    e.respondWith(caches.match(req).then(c=>c||fetch(req).then(res=>{ const copy=res.clone(); caches.open('otter-shell').then(c=>c.put(req, copy)); return res; }).catch(()=>caches.match('/index.html')))); return;
  }
  if(/\.(mp3|mp4|wav|m4a|aac|webm|ogg)$/i.test(url.pathname) || req.destination==='audio' || req.destination==='video'){
    e.respondWith(caches.open('otter-media').then(async c=>{ const hit=await c.match(req.url); if(hit) return hit; try{ return await fetch(req); }catch(_){ return caches.match('/index.html'); } })); return;
  }
  e.respondWith(fetch(req).catch(()=>caches.match('/index.html')));
});
