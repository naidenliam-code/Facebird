// sw-register.js
(function () {
  if (!('serviceWorker' in navigator)) return;

  // Base automatique (ex: "/Facebird/")
  const basePath = new URL('.', location.href).pathname;
  const swURL = new URL('service-worker.js', location.href).toString();

  navigator.serviceWorker.register(swURL, { scope: basePath })
    .then(reg => {
      console.log('[SW] enregistré:', swURL, 'scope:', reg.scope);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw && nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] nouvelle version prête');
            // Pour activer direct si tu veux :
            // reg.waiting?.postMessage('SKIP_WAITING');
          }
        });
      });
    })
    .catch(err => console.warn('[SW] échec enregistrement:', err));
})();
