// FaceBird — enregistrement du Service Worker + gestion de mise à jour
(function(){
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js');
      console.log('[SW] enregistré :', reg.scope);

      // détecte une MAJ du SW
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // nouvelle version prête
              console.log('[SW] nouvelle version prête (rechargement conseillé)');
              // Option : demander au SW d’activer tout de suite
              // newWorker.postMessage('SKIP_WAITING');
            } else {
              console.log('[SW] premier cache prêt (offline OK) ✅');
            }
          }
        });
      });

      // écoute quand le SW prend le contrôle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

    } catch (err) {
      console.warn('[SW] échec enregistrement :', err);
    }
  });
})();
