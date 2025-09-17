// Enregistre le Service Worker pour le sous-chemin GitHub Pages
(function(){
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Facebird/service-worker.js', { scope: '/Facebird/' })
      .then(() => console.log('[FaceBird] SW enregistré'))
      .catch(err => console.warn('[FaceBird] SW erreur:', err));
  }
})();
