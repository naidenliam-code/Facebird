// sw-register.js
// =========================================================================
// FaceBird – Enregistreur du Service Worker (GitHub Pages compatible)
// =========================================================================
(function () {
  if (!('serviceWorker' in navigator)) return;

  const basePath = new URL('.', location.href).pathname;
  const swURL = new URL('service-worker.js', location.href).toString();

  navigator.serviceWorker.register(swURL, { scope: basePath })
    .then(reg => {
      console.log('[SW] Enregistré :', swURL, 'Scope :', reg.scope);

      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw && nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Nouvelle version prête.');
            // reg.waiting?.postMessage('SKIP_WAITING');
          }
        });
      });
    })
    .catch(err => console.warn('[SW] Échec de l’enregistrement :', err));
})();
