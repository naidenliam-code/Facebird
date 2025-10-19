// carte.js — charge Leaflet avec repli + initialise la carte proprement
(function () {
  // ---------- utils chargement dynamique ----------
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve(href);
      link.onerror = () => reject(new Error('CSS load failed: ' + href));
      document.head.appendChild(link);
    });
  }

  function loadJS(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = () => resolve(src);
      s.onerror = () => reject(new Error('JS load failed: ' + src));
      document.head.appendChild(s);
    });
  }

  async function loadLeaflet() {
    // Deux CDNs, on essaie dans l’ordre
    const CSS_CANDIDATES = [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'
    ];
    const JS_CANDIDATES = [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
      'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'
    ];

    let cssOk = false, jsOk = false, lastErr = null;

    for (const u of CSS_CANDIDATES) {
      try { await loadCSS(u + '?v=2'); cssOk = true; break; } catch (e) { lastErr = e; }
    }
    for (const u of JS_CANDIDATES) {
      try { await loadJS(u + '?v=2'); jsOk = true; break; } catch (e) { lastErr = e; }
    }

    if (!(cssOk && jsOk)) throw lastErr || new Error('Leaflet not loaded');
    if (typeof window.L === 'undefined') throw new Error('Leaflet namespace missing');
  }

  function fail(msg) {
    console.warn('[Carte] ', msg);
    const info = document.getElementById('map-empty');
    if (info) {
      info.textContent = msg;
      info.style.display = 'block';
    } else {
      alert(msg);
    }
  }

  function invalidateOnChanges(map) {
    // Force la mise à jour de la taille (onglet rendu, resize, etc.)
    setTimeout(() => map.invalidateSize(), 150);
    window.addEventListener('resize', () => map.invalidateSize());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) map.invalidateSize();
    });
  }

  // ---------- démarrage ----------
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    fail('Élément #map introuvable sur la page.');
    return;
  }

  (async () => {
    try {
      // IMPORTANT : contourner un SW trop agressif
      // -> on modifie l’URL ( ?v=2 ) ci-dessus et on incrémente la VERSION dans ton SW
      await loadLeaflet();

      // Leaflet OK -> on instancie la carte
      const map = L.map('map', { zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Centre par défaut
      map.setView([48.8566, 2.3522], 12); // Paris

      // Affiche tes observations locales si tu en as
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

      const empty = document.getElementById('map-empty');
      if (!obs.length) {
        empty && (empty.style.display = 'block');
      } else {
        empty && (empty.style.display = 'none');

        const group = L.featureGroup();
        obs.forEach(o => {
          L.marker([o.lat, o.lng])
            .addTo(map)
            .bindPopup(
              `<b>${escapeHtml(o.title)}</b><br>
               <small style="opacity:.8">par ${escapeHtml(o.userName)}${o.date ? ' · ' + escapeHtml(o.date) : ''}</small>
               ${o.description ? `<div style="margin-top:.25rem">${escapeHtml(o.description)}</div>` : ''}`
            );
          group.addLayer(L.marker([o.lat, o.lng]));
        });
        try { map.fitBounds(group.getBounds().pad(0.2)); } catch {}
      }

      invalidateOnChanges(map);

      function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({
          '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[m]));
      }
    } catch (e) {
      console.error(e);
      fail('Impossible de charger Leaflet (réseau/CDN/SW). Ouvre la console.');
    }
  })();
})();
