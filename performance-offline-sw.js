// Offline performance shell, beta + development; live requests still require internet.
const SHELL='performance-offline-shell-v5';
const PATHS=[
 'performance-beta.html','performance-development.html',
 'performance-movable-toolbar-test.html','performance-three-requests-test.html',
 'performance-clean-stage-az-test.html','performance-offline-beta.html'
];
const PAGES=PATHS.map(p=>new URL('./'+p,self.registration.scope).href);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);
  // An older test file may not be deployed; cache every available page independently.
  await Promise.all(PAGES.map(async url=>{
   try{const response=await fetch(new Request(url,{cache:'reload'}));if(response.ok)await cache.put(url,response)}catch(e){}
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('performance-offline-shell-')&&key!==SHELL)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 const target=request.url.split('#')[0].split('?')[0];
 if(request.mode!=='navigate'||!PAGES.includes(target))return;
 event.respondWith((async()=>{
  const cache=await caches.open(SHELL);
  try{
   const response=await fetch(request);
   if(response.ok)await cache.put(target,response.clone());
   return response;
  }catch(e){
   const cached=await cache.match(target);
   if(cached)return cached;
   throw e;
  }
 })());
});
