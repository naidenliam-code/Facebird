// Enregistre le SW si supporté
(function(){
  if ('serviceWorker' in navigator) {
    // IMPORTANT: le SW doit être à la racine du scope (/Facebird/)
    navigator.serviceWorker.register('/Facebird/service-worker.js')
      .catch(err => console.warn('[FaceBird] SW register error:', err));
  }
})();
