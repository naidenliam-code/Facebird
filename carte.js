/* FaceBird - Carte : Loader robuste + diagnostics visibles  */

(function () {
  const elMap = document.getElementById('map');
  if (!elMap) {
    console.error('[FaceBird:carte] #map introuvable dans carte.html');
    alert('Erreur FaceBird: conteneur #map manquant dans carte.html');
    return;
  }

  // Petite aide visuelle
  elMap.style.background = '#f1f2f6';
  elMap.style.minHeight = elMap.style.minHeight || '68vh';

  // Zone d'erreur
  let elErr = document.getElementById('map-error');
  if (!elErr) {
    elErr = document.createElement('div');
    elErr.id = 'map-error';
    elErr.style.display = 'none';
    elErr.style.marginTop = '10px';
    elErr.style.color = '#b91c1c';
    elErr.style.background = '#fee2e2';
    elErr.style.border = '1px solid #fecaca';
    elErr.style.padding = '10px 12px';
    elErr.style.borderRadius = '10px';
    elMap.parentElement && elMap.parentElement.appendChild(elErr);
  }
  function showError(msg) {
    console.error('[FaceBird:carte] ' + msg);
    elErr.textContent = msg;
    elErr.style.display = 'block';
  }

  // 1) Charger Leaflet (CSS + JS) avec 3 CDN de secours
  const CDN = {
    css: [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
    ],
    js: [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
      'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
    ]
  };

  function loadCSS(url) {
    return new Promise((res, rej) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => res(url);
      link.onerror = () => rej(new Error('CSS fail: ' + url));
      document.head.appendChild(link);
    });
  }
  function loadJS(url) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = url;
      s.defer = true;
      s.onload = () => res(url);
      s.onerror = () => rej(new Error('JS fail: ' + url));
      document.head.appendChild(s);
    });
  }
  async function loadLeaflet() {
    // CSS : premier OK => on continue
    let cssOk = false, lastErr = null;
    for (const url of CDN.css) {
      try { await loadCSS(url); cssOk = true; console.log('[FaceBird:carte] CSS Leaflet:', url); break; }
      catch (e) { lastErr = e; }
    }
    if (!cssOk) throw lastErr || new Error('Impossible de charger leaflet.css');

    // JS : premier OK => L doit exister
    for (const url of CDN.js) {
      try {
        await loadJS(url);
        if (typeof L !== 'undefined') {
          console.log('[FaceBird:carte] JS Leaflet:', url);
          return;
        }
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Impossible de charger leaflet.js');
  }

  // 2) Tuiles avec fallback : OSM → Carto → Stamen
  const TILESETS = [
    {
      name: 'OSM',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      opts: { maxZoom: 19, attribution: '&copy; OpenStreetMap' }
    },
    {
      name: 'Carto Light',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      opts: { maxZoom: 20, attribution: '&copy; CartoDB' }
    },
    {
      name: 'Stamen Toner',
      url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
      opts: { maxZoom: 20, attribution: '&copy; Stamen' }
    }
  ];

  function getObservations() {
    try {
      const raw = localStorage.getItem('fb_observations');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function computeCenter(obs) {
    const DEFAULT = [50.5039, 4.4699]; // Belgique
    if (!obs.length) return { center: DEFAULT, zoom: 7 };
    const valid = obs.filter(o => typeof o.lat === 'number' && typeof o.lng === 'number');
    if (!valid.length) return { center: DEFAULT, zoom: 7 };
    const lat = valid.reduce((s, o) => s + o.lat, 0) / valid.length;
    const lng = valid.reduce((s, o) => s + o.lng, 0) / valid.length;
    return { center: [lat, lng], zoom: 9 };
  }

  function initMapWithTiles() {
    const obs = getObservations();
    const { center, zoom } = computeCenter(obs);

    console.log('[FaceBird:carte] Init map @', center, 'zoom', zoom);
    const map = L.map('map', { zoomControl: true, preferCanvas: true }).setView(center, zoom);

    // Marqueur test (utile pr diagnostiquer “fond gris”)
    L.marker([50.5039, 4.4699]).addTo(map).bindPopup('Test 🇧🇪 (si tu vois ce point, Leaflet tourne)');

    // Essaie les tuiles l’une après l’autre si erreur
    let current = 0;
    function tryTileset(i) {
      const set = TILESETS[i];
      if (!set) {
        showError('Toutes les sources de tuiles ont échoué. Réseau ou blocage des CDN ?');
        return;
      }
      console.log('[FaceBird:carte] Essai tuiles :', set.name, set.url);

      const layer = L.tileLayer(set.url, set.opts);
      let hadTileError = false;

      layer.on('load', () => {
        console.log('[FaceBird:carte] Tuiles OK via', set.name);
        map.addLayer(layer);
        setTimeout(() => map.invalidateSize(), 100);
      });
      layer.on('tileerror', (e) => {
        hadTileError = true;
        console.warn('[FaceBird:carte] tileerror', e);
        // Attends un peu pour voir si au moins une tuile arrive
        setTimeout(() => {
          if (!layer._tiles || !Object.keys(layer._tiles).length) {
            console.warn('[FaceBird:carte] Aucune tuile chargée via', set.name, '→ fallback suivant');
            tryTileset(i + 1);
          } else {
            console.log('[FaceBird:carte] Certaines tuiles en erreur mais layer partiellement OK via', set.name);
            map.addLayer(layer);
          }
        }, 1200);
      });

      // Ajoute le layer (déclenche load/tileerror)
      layer.addTo(map);
    }

    tryTileset(current);

    // Place aussi tes observations si tu en as
    obs
      .filter(o => typeof o.lat === 'number' && typeof o.lng === 'number')
      .forEach(o => {
        L.marker([o.lat, o.lng]).addTo(map).bindPopup(
          `<strong>${o.nom ?? 'Observation'}</strong><br>${o.espece ?? ''} ${o.date ? ('• ' + o.date) : ''}`
        );
      });

    // À tout hasard (layout tardif)
    setTimeout(() => map.invalidateSize(), 500);
  }

  // 3) Démarrage
  loadLeaflet()
    .then(() => {
      console.log('[FaceBird:carte] Leaflet OK, version:', L.version);
      initMapWithTiles();
    })
    .catch(err => {
      showError('Leaflet indisponible : ' + err.message);
    });

  // Conseil : si tu as un Service Worker, il peut avoir mis en cache d’anciennes versions.
  // Sur PC : Ctrl+F5 / DevTools > Application > Service Workers > "Unregister" puis reload.
})();
