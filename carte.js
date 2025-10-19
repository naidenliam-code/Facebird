// carte.js — charge Leaflet d'abord en local, puis fallback CDNs, puis initialise la carte.
(function () {
  // -------- helpers --------
  function basePath() {
    // ex: "/Facebird/" sur GitHub Pages
    return new URL('./', self.location.href).pathname;
  }
  function b_join(p) {
    // joint base + p (sans double slash)
    return basePath().replace(/\/+$/,'') + '/' + String(p).replace(/^\/+/, '');
  }
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
    const TRY = [
      // 1) local
      {
        css: b_join('vendor/leaflet/leaflet.css') + '?v=1',
        js:  b_join('vendor/leaflet/leaflet.js')  + '?v=1'
      },
      // 2) unpkg
      {
        css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css?v=1',
        js:  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js?v=1'
      },
      // 3) jsDelivr
      {
        css: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css?v=1',
        js:  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js?v=1'
      }
    ];
    let lastErr;
    for (const src of TRY) {
      try {
        await loadCSS(src.css);
        await loadJS(src.js);
        if (window.L) return; // succès
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Leaflet not loaded');
  }

  function showError(msg) {
    console.warn('[Carte] ' + msg);
    const p = document.getElementById('map-empty');
    if (p) {
      p.textContent = msg;
      p.style.display = 'block';
    } else {
      alert(msg);
    }
  }

  function invalidateOnChanges(map) {
    setTimeout(() => map.invalidateSize(), 150);
    window.addEventListener('resize', () => map.invalidateSize());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) map.invalidateSize();
    });
  }

  // -------- start --------
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    showError('Élément #map introuvable.');
    return;
  }

  (async () => {
    try {
      // Important : anti-cache côté SW (au cas où un ancien fichier est servi)
      // -> incrémente la VERSION dans ton service-worker aussi.
      await loadLeaflet();

      const map = L.map('map', { zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // centre par défaut
      map.setView([48.8566, 2.3522], 12);

      // récupère les observations locales si présentes
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
        empty && (empty.textContent = 'Aucune observation à afficher.'); 
        empty && (empty.style.display = 'block');
      } else {
        empty && (empty.style.display = 'none');
        const group = L.featureGroup();
        obs.forEach(o => {
          const m = L.marker([o.lat, o.lng]).addTo(map);
          m.bindPopup(
            `<b>${escapeHtml(o.title)}</b><br>
             <small style="opacity:.75">par ${escapeHtml(o.userName)}${o.date ? ' · ' + escapeHtml(o.date) : ''}</small>
             ${o.description ? `<div style="margin-top:.25rem">${escapeHtml(o.description)}</div>` : ''}`
          );
          group.addLayer(m);
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
      showError('Impossible de charger Leaflet (réseau/CDN/SW). Ouvre la console pour les détails.');
    }
  })();
})();
