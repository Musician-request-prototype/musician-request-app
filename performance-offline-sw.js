// Songbook offline page shell. Audience requests remain network-only.
const SHELL='performance-offline-shell-v1';
const PAGE=new URL('./performance-offline-beta.html',self.registration.scope).href;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(SHELL).then(cache=>cache.add(new Request(PAGE,{cache:'reload'}))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('performance-offline-shell-')&&key!==SHELL)await caches.delete(key)}await self.clients.claim()})());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.mode!=='navigate'||new URL(request.url).pathname!==new URL(PAGE).pathname)return;
 event.respondWith((async()=>{
  const cache=await caches.open(SHELL);
  try{const response=await fetch(request);if(response.ok)await cache.put(PAGE,response.clone());return response;}
  catch(e){const cached=await cache.match(PAGE);if(cached)return cached;throw e;}
 })());
});
