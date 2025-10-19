// carte.js — initialisation Leaflet + marqueurs depuis le localStorage
(function () {
  const MAP_ID = 'map';
  const mapEl = document.getElementById(MAP_ID);
  if (!mapEl) return;

  // Récupère les observations stockées localement
  // Format attendu pour chaque item (souple) :
  // { id, title, lat, lng, userId, userName, date, description }
  function loadObservations() {
    try {
      const raw = localStorage.getItem('fb_observations');
      const arr = JSON.parse(raw || '[]');
      if (!Array.isArray(arr)) return [];
      return arr
        .map(o => ({
          id: o.id ?? String(Math.random()),
          title: o.title || o.nom || 'Observation',
          lat: Number(o.lat ?? o.latitude),
          lng: Number(o.lng ?? o.longitude),
          userName: o.userName || o.user || 'Anonyme',
          date: o.date || o.createdAt || '',
          description: o.description || o.desc || ''
        }))
        .filter(o => Number.isFinite(o.lat) && Number.isFinite(o.lng));
    } catch {
      return [];
    }
  }

  // Initialise la carte
  const map = L.map(MAP_ID, {
    zoomControl: true,
    attributionControl: true
  });

  // Fonds de carte OSM
  const tileLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  );
  tileLayer.addTo(map);

  // Centre par défaut (Europe occidentale)
  map.setView([50.5, 4.2], 6);

  // Ajoute les marqueurs
  const obs = loadObservations();
  const emptyMsg = document.getElementById('map-empty');

  if (!obs.length) {
    emptyMsg && (emptyMsg.style.display = 'block');
  } else {
    emptyMsg && (emptyMsg.style.display = 'none');
    const group = L.featureGroup();

    obs.forEach(o => {
      const popup = `
        <div class="stack" style="gap:.25rem;min-width:180px">
          <b>${escapeHtml(o.title)}</b>
          <div style="font-size:.9em;opacity:.8">
            par ${escapeHtml(o.userName)}${o.date ? ' · ' + escapeHtml(o.date) : ''}
          </div>
          ${o.description ? `<div>${escapeHtml(o.description)}</div>` : ''}
          <div class="muted" style="font-size:.85em">(${o.lat.toFixed(4)}, ${o.lng.toFixed(4)})</div>
        </div>
      `;
      const marker = L.marker([o.lat, o.lng]).bindPopup(popup);
      marker.addTo(map);
      group.addLayer(marker);
    });

    // Ajuste la vue pour englober tous les marqueurs
    try {
      map.fitBounds(group.getBounds().pad(0.2));
    } catch {}
  }

  // Petites aides utilitaires
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"':'&quot;', "'": '&#39;'
    }[m]));
  }
})();
