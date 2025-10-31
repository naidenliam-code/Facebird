// FaceBird - Carte: initialisation robuste + logs visibles
(function () {
  const elMap = document.getElementById('map');
  const elErr = document.getElementById('map-error');

  function showError(msg) {
    console.error('[FaceBird:carte] ' + msg);
    if (elErr) {
      elErr.style.display = 'block';
      elErr.textContent = msg;
    }
  }

  function ensureLeafletLoaded() {
    if (typeof L !== 'undefined') return Promise.resolve();
    // si le <script> n’a pas encore chargé (defer), on attend le onload du doc
    return new Promise((resolve, reject) => {
      const maxWait = setTimeout(() => reject(new Error('Timeout chargement Leaflet')), 4000);
      window.addEventListener('load', () => {
        clearTimeout(maxWait);
        if (typeof L !== 'undefined') resolve();
        else reject(new Error('Leaflet indisponible après load'));
      });
    });
  }

  function getObservations() {
    // récupère tes observations locales (adaptable à ta structure)
    try {
      const raw = localStorage.getItem('fb_observations');
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function initMap() {
    // centre par défaut : Belgique
    const DEFAULT = [50.5039, 4.4699];
    let view = DEFAULT, zoom = 7;

    // si tu as des observations avec lat/lng, on centre dessus
    const obs = getObservations().filter(o => typeof o.lat === 'number' && typeof o.lng === 'number');
    if (obs.length) {
      // moyenne simple des lat/lng comme centre
      const lat = obs.reduce((s,o)=>s+o.lat,0)/obs.length;
      const lng = obs.reduce((s,o)=>s+o.lng,0)/obs.length;
      view = [lat, lng];
      zoom = 9;
    }

    console.log('[FaceBird:carte] Init Leaflet…');
    const map = L.map('map', { zoomControl: true, preferCanvas: true }).setView(view, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // place des marqueurs si présents
    obs.forEach(o => {
      const m = L.marker([o.lat, o.lng]).addTo(map);
      const popup = `
        <strong>${o.nom ?? 'Observation'}</strong><br>
        ${o.espece ?? ''} ${o.date ? ('• ' + o.date) : ''}
      `;
      m.bindPopup(popup);
    });

    // force un resize au cas où le conteneur ait été rendu hors-écran
    setTimeout(() => map.invalidateSize(), 100);
  }

  // --- Démarrage ---
  if (!elMap) {
    showError('Conteneur #map introuvable.');
    return;
  }

  ensureLeafletLoaded()
    .then(initMap)
    .catch(err => {
      showError('Impossible de charger Leaflet : ' + err.message);
    });
})();
