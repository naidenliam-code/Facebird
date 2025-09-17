// FaceBird - Observations avec persistance + GPS optionnel
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'fb-observations-v1';

  const form = document.getElementById('obs-form');
  const grid = document.getElementById('obs-grid');
  const clearBtn = document.getElementById('clear-obs');
  const dateInput = form?.querySelector('input[name="date"]');
  const latInput = form?.querySelector('input[name="lat"]');
  const lngInput = form?.querySelector('input[name="lng"]');
  const geoBtn   = document.getElementById('geo-btn');
  const geoInfo  = document.getElementById('geo-status');

  // --- stockage ---
  const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; } };
  const save = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  // --- sécurité HTML ---
  const escapeHtml = (str='') => String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[s]));

  // --- rendu d'une carte ---
  function addCardFromObj(obs, prepend=false){
    const card = document.createElement('div');
    card.className = 'card';
    const hasGPS = (typeof obs.lat === 'number' && typeof obs.lng === 'number');
    card.innerHTML = `
      <h3>🐦 ${escapeHtml(obs.espece)}</h3>
      <p>
        <span class="badge">${escapeHtml(obs.lieu)}</span> • ${escapeHtml(obs.date)}
        ${hasGPS ? ` • <span class="badge">GPS ✔</span>` : ``}
      </p>
      <p>${escapeHtml(obs.desc)}</p>
    `;
    prepend ? grid.prepend(card) : grid.append(card);
  }

  // --- date par défaut ---
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0,10);
  }

  // --- rendu initial ---
  const initial = load();
  if (initial.length) initial.forEach(obs => addCardFromObj(obs, true));

  // --- GPS : récupérer la position ---
  geoBtn?.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      geoInfo.textContent = "GPS non supporté ❌";
      return;
    }
    geoInfo.textContent = "Recherche de la position…";
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      if (latInput) latInput.value = String(latitude);
      if (lngInput) lngInput.value = String(longitude);
      geoInfo.textContent = `Position ajoutée ✔ (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }, () => {
      geoInfo.textContent = "Impossible d’obtenir la position ❌";
    }, { enableHighAccuracy:true, timeout: 8000, maximumAge: 0 });
  });

  // --- soumission du formulaire ---
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const espece = (data.get('espece')||'').toString().trim();
    if (!espece) return;

    // convertir lat/lng si présents
    const latVal = (data.get('lat')||'').toString().trim();
    const lngVal = (data.get('lng')||'').toString().trim();
    const lat = latVal ? Number(latVal) : null;
    const lng = lngVal ? Number(lngVal) : null;

    const obs = {
      espece,
      lieu: (data.get('lieu')||'Lieu').toString().trim() || 'Lieu',
      date: (data.get('date')||'').toString() || 'Aujourd’hui',
      desc: (data.get('desc')||'—').toString().trim() || '—',
      ts: Date.now(),
      ...(Number.isFinite(lat) && Number.isFinite(lng) ? {lat, lng} : {})
    };

    addCardFromObj(obs, true);
    const list = load(); list.unshift(obs); save(list);

    // Badges
    if (window.FB_BADGES){
      window.FB_BADGES.incCount();
      const sp = (obs.espece || '').toLowerCase();
      if (sp.includes('hibou'))                    window.FB_BADGES.award('owl_spot');
      if (sp.includes('mésange') || sp.includes('mesange')) window.FB_BADGES.award('mesange');
      if (sp.includes('pigeon'))                   window.FB_BADGES.award('pigeon');
    }

    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0,10);
    if (geoInfo) geoInfo.textContent = ""; // reset message GPS
  });

  // --- bouton effacer ---
  clearBtn?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    grid.querySelectorAll('.card').forEach(n => n.remove());
  });
});
