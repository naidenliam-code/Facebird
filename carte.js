/* FaceBird — carte.js (ultra-fallback)
   - Essaie 10+ fournisseurs de tuiles
   - Teste 1 tuile avant d’ajouter la couche (pour éviter “gris”)
   - Messages d’erreur clairs
*/

(function () {
  const mapEl = document.getElementById('map');
  if (!mapEl) { alert('FaceBird: #map introuvable'); return; }
  mapEl.style.background = '#eef1f5';
  mapEl.style.minHeight  = mapEl.style.minHeight || '68vh';

  let errBox = document.getElementById('map-error');
  if (!errBox) {
    errBox = document.createElement('div');
    errBox.id = 'map-error';
    errBox.style.display = 'none';
    errBox.style.marginTop = '10px';
    errBox.style.color = '#b91c1c';
    errBox.style.background = '#fee2e2';
    errBox.style.border = '1px solid #fecaca';
    errBox.style.padding = '10px 12px';
    errBox.style.borderRadius = '10px';
    mapEl.parentElement && mapEl.parentElement.appendChild(errBox);
  }
  const showError = (m) => { console.warn('[FaceBird:carte] ' + m); errBox.textContent = m; errBox.style.display = 'block'; };

  // ----- Leaflet présent ? (tu as déjà importé Leaflet dans carte.html via <script> et <link>) -----
  if (typeof L === 'undefined') {
    showError('Leaflet est introuvable. Vérifie que carte.html charge bien leaflet.css & leaflet.js.');
    return;
  }

  // ----- Récupère les obs stockées (pour centrer) -----
  function getObs() {
    try {
      const raw = localStorage.getItem('fb_observations');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function getCenter() {
    const def = [50.5039, 4.4699]; // Belgique
    const obs = getObs().filter(o => typeof o.lat === 'number' && typeof o.lng === 'number');
    if (!obs.length) return { center: def, zoom: 7 };
    const lat = obs.reduce((s, o) => s + o.lat, 0) / obs.length;
    const lng = obs.reduce((s, o) => s + o.lng, 0) / obs.length;
    return { center: [lat, lng], zoom: 9 };
  }

  const { center, zoom } = getCenter();
  const map = L.map('map', { zoomControl: true, preferCanvas: true }).setView(center, zoom);

  // Marqueur test (si tu le vois → Leaflet tourne)
  L.marker([50.5039, 4.4699]).addTo(map).bindPopup('Test 🇧🇪');

  // ----- Liste de tuiles (beaucoup de chances qu’ESRI passe) -----
  const TILESETS = [
    { name:'OSM', url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', opts:{maxZoom:19, subdomains:['a','b','c']} },
    { name:'OSM FR', url:'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', opts:{maxZoom:20, subdomains:['a','b','c']} },
    { name:'OSM DE', url:'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', opts:{maxZoom:18, subdomains:['a','b','c']} },
    { name:'OSM HOT', url:'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', opts:{maxZoom:20, subdomains:['a','b','c']} },
    { name:'OpenTopo', url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', opts:{maxZoom:17, subdomains:['a','b','c']} },
    { name:'Carto Light', url:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', opts:{maxZoom:20, subdomains:'abcd'} },
    { name:'Carto Voyager', url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', opts:{maxZoom:20, subdomains:'abcd'} },
    { name:'Stamen Toner', url:'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', opts:{maxZoom:20} },
    // ESRI (très permissif, marche souvent quand OSM est bloqué)
    { name:'ESRI Street', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', opts:{maxZoom:19} },
    { name:'ESRI Topo', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', opts:{maxZoom:19} },
    { name:'ESRI Gray', url:'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', opts:{maxZoom:16} },
  ];

  // Teste **une tuile** d’abord (au centre approximatif du Benelux pour z=6)
  function testOneTile(tileset) {
    return new Promise((resolve, reject) => {
      // calcule une tuile au zoom 6 autour de la Belgique
      const z = 6, lat = 50.5, lon = 4.4;
      const xtile = Math.floor((lon + 180) / 360 * Math.pow(2, z));
      const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

      const url = tileset.url
        .replace('{z}', z)
        .replace('{x}', xtile)
        .replace('{y}', ytile)
        .replace('{s}', (tileset.opts.subdomains && tileset.opts.subdomains[0]) || 'a')
        .replace('{r}', '');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('tile blocked: ' + tileset.name));
      img.src = url;
    });
  }

  function addObsMarkers() {
    const obs = getObs();
    obs.filter(o => typeof o.lat === 'number' && typeof o.lng === 'number')
      .forEach(o => {
        L.marker([o.lat, o.lng]).addTo(map).bindPopup(
          `<strong>${o.nom ?? 'Observation'}</strong><br>${o.espece ?? ''} ${o.date ? ('• ' + o.date) : ''}`
        );
      });
  }

  (async function pickTiles() {
    for (const t of TILESETS) {
      try {
        await testOneTile(t);
        const layer = L.tileLayer(t.url, Object.assign({
          attribution: '&copy; contributors',
          crossOrigin: true
        }, t.opts));
        layer.on('load', () => console.log('[FaceBird:carte] Tuiles OK via', t.name));
        layer.on('tileerror', (e) => console.warn('[FaceBird:carte] tileerror', t.name, e));
        layer.addTo(map);
        addObsMarkers();
        setTimeout(() => map.invalidateSize(), 150);
        return;
      } catch (e) {
        console.warn('[FaceBird:carte] KO', t.name, e.message);
      }
    }
    showError('Toutes les sources de tuiles ont échoué. Probable blocage réseau/CDN. Essaie sur 4G ou un autre Wi-Fi.');
  })();
})();
