'use strict';
const VERSION='subscriber-offline-20261026-v11',CACHE=VERSION,BASE=new URL('./',self.location.href),SHELL=new URL('subscriber-performance-test.html',BASE).href;
const assets=[SHELL,new URL('subscriber-offline-core.js',BASE).href];
const routes=new Set(['subscriber-offline-test.html','subscriber-signup-test.html','subscriber-library-test.html','subscriber-performance-test.html'].map(p=>new URL(p,BASE).pathname));
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const url of assets){const response=await fetch(url,{cache:'reload'});if(!response.ok||response.type==='opaque')throw Error('Offline files unavailable');const text=await response.clone().text();if(!text.includes(VERSION))throw Error('Offline files have mismatched versions');await cache.put(url,response)}await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Only the four subscriber navigation routes above are handled. No solo/public pages, SDK, auth or database responses are cached.
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==BASE.origin)return;
if(url.pathname===new URL('subscriber-offline-core.js',BASE).pathname){event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(assets[1])||fetch(request)})());return}
if(request.mode!=='navigate'||!routes.has(url.pathname))return;
event.respondWith((async()=>{const cache=await caches.open(CACHE);if(self.navigator?.onLine===false){const saved=await cache.match(SHELL);if(saved)return saved;}const timeout=new AbortController(),timer=setTimeout(()=>timeout.abort(),5000);try{const response=await fetch(request,{signal:timeout.signal,cache:'no-store'});if(response.ok)return response;const saved=await cache.match(SHELL);return saved||response}catch(error){const saved=await cache.match(SHELL);if(saved)return saved;throw error}finally{clearTimeout(timer)}})())});
self.addEventListener('message',event=>{if(event.data?.type==='OFFLINE_READY')event.waitUntil((async()=>{const cache=await caches.open(CACHE);const ready=(await Promise.all(assets.map(url=>cache.match(url)))).every(Boolean);event.ports?.[0]?.postMessage({version:VERSION,ready})})())});
