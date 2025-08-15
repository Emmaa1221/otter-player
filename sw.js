const SHELL=['/','/index.html','/style.css','/player.js','/manifest.webmanifest','/assets/icon-192.png','/assets/icon-512.png','/assets/words_3000.json'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open('otter-wf-shell').then(c=>c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch',e=>{
  const req=e.request;
  e.respondWith(
    caches.match(req).then(c=>c||fetch(req).then(res=>{
      const url=new URL(req.url);
      if(url.origin===location.origin && (/\.(css|js|png|webmanifest|json)$/.test(url.pathname) || url.pathname.endsWith('/'))){
        const copy=res.clone(); caches.open('otter-wf-shell').then(c=>c.put(req, copy));
      }
      return res;
    }).catch(()=>caches.match('/index.html')))
  );
});
