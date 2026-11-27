var C='shadows-crm-v44';
var A=['./','index.html','css/app.css?v=44','css/light.css?v=44','css/polish.css?v=44','js/config.js?v=44','js/i18n.js?v=44','js/store.js?v=44','js/dial.js?v=44','js/fx.js?v=44','js/app.js?v=44','assets/eye.webp?v=44','join.html','results.html','assets/owl-head.webp','assets/owl-wings.webp','assets/wordmark.webp','assets/icon-192.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(A)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);if(u.origin!==location.origin)return;
e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)});return res}).catch(function(){return caches.match(r).then(function(m){return m||caches.match('index.html')})}))});
