// carte.js — initialisation Leaflet + affichage des observations locales
(function () {
  function fail(msg) {
    console.warn('[Carte]', msg);
    const info = document.getElementById('map-empty');
    if (info) {
      info.textContent = msg;
      info.style.display = 'block';
    } else {
      alert(msg);
    }
  }

  const mapEl = document.getElementById('map');
  if (!mapEl) return fail('Élément #map introuvable.');

  if (typeof L === 'undefined') {
    return fail('Leaflet ne s’est pas chargé. Vérifie la console/réseau (CDN).');
  }

  // Init carte
  const map = L.map('map', { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Sélectionne un centre par défaut
  map.setView([48.8566, 2.3522], 12); // Paris

  // Invalide taille après rendu / changements
  setTimeout(() => map.invalidateSize(), 100);
  window.addEventListener('resize', () => map.invalidateSize());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) map.invalidateSize();
  });

  // Charge tes observations locales (optionnel)
  function loadObservations() {
    try {
      const arr = JSON.parse(localStorage.getItem('fb_observations') || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  const obs = loadObservations()
    .map(o => ({
      title: o.title || o.nom || 'Observation',
      lat: Number(o.lat ?? o.latitude),
      lng: Number(o.lng ?? o.longitude),
      userName: o.userName || o.user || 'Anonyme',
      date: o.date || o.createdAt || '',
      description: o.description || o.desc || ''
    }))
    .filter(o => Number.isFinite(o.lat) && Number.isFinite(o.lng));

  const info = document.getElementById('map-empty');
  if (!obs.length) {
    info && (info.style.display = 'block');
    return;
  }
  info && (info.style.display = 'none');

  const group = L.featureGroup();
  obs.forEach(o => {
    const html = `
      <div style="min-width:180px">
        <b>${escapeHtml(o.title)}</b><br>
        <small style="opacity:.8">par ${escapeHtml(o.userName)}${o.date ? ' · ' + escapeHtml(o.date) : ''}</small>
        ${o.description ? `<div style="margin-top:.25rem">${escapeHtml(o.description)}</div>` : ''}
      </div>`;
    L.marker([o.lat, o.lng]).addTo(map).bindPopup(html);
    group.addLayer(L.marker([o.lat, o.lng]));
  });
  try { map.fitBounds(group.getBounds().pad(0.2)); } catch {}

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }
})();
