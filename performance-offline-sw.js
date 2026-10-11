// Offline songbook shell — preserve original offline beta and new clean-stage test.
const SHELL='performance-offline-shell-v4';
const PATHS=['performance-offline-beta.html','performance-clean-stage-az-test.html','performance-three-requests-test.html','performance-movable-toolbar-test.html'];
const PAGES=PATHS.map(x=>new URL('./'+x,self.registration.scope).href);
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(PAGES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('performance-offline-shell-')&&key!==SHELL)await caches.delete(key);await self.clients.claim()})());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.mode!=='navigate'||!PAGES.includes(request.url.split('#')[0].split('?')[0]))return;
 event.respondWith((async()=>{
  const cache=await caches.open(SHELL);
  try{const response=await fetch(request);if(response.ok)await cache.put(request.url.split('#')[0].split('?')[0],response.clone());return response}
  catch(e){const cached=await cache.match(request.url.split('#')[0].split('?')[0]);if(cached)return cached;throw e}
 })());
});
