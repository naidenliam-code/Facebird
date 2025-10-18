// observations.js — Observations locales + publication auto dans le Fil

(function () {
  const keyObs = 'fb_observations';
  const keyFeed = 'facebird_posts';

  const $ = (s) => document.querySelector(s);
  const listEl = $('#obs-list');

  let items = [];

  // ---------- Chargement / Sauvegarde ----------
  function load() {
    try { items = JSON.parse(localStorage.getItem(keyObs) || '[]'); }
    catch { items = []; }
  }
  function save() {
    localStorage.setItem(keyObs, JSON.stringify(items));
  }

  // ---------- Ajout dans le Fil ----------
  function addToFeed(text) {
    let feed = [];
    try { feed = JSON.parse(localStorage.getItem(keyFeed) || '[]'); } catch { feed = []; }
    const post = { text, date: new Date().toLocaleString() };
    feed.unshift(post);
    localStorage.setItem(keyFeed, JSON.stringify(feed));
  }

  // ---------- Rendu ----------
  function render() {
    if (!items.length) {
      listEl.innerHTML = '<p class="muted">Aucune observation pour le moment.</p>';
      return;
    }
    listEl.innerHTML = items.map(o => `
      <div class="post">
        <p><strong>🪶 ${o.species}</strong> — ${o.date}${o.time ? ' ' + o.time : ''}</p>
        ${o.notes ? `<p>${o.notes.replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    `).join('');
  }

  // ---------- Nouveau / Enregistrer ----------
  function handleSave() {
    const species = $('#obs-species').value.trim();
    const date    = $('#obs-date').value || new Date().toISOString().slice(0,10);
    const time    = $('#obs-time').value || '';
    const notes   = $('#obs-notes').value.trim();

    if (!species) return;

    const obs = { species, date, time, notes };
    items.unshift(obs);
    save();

    // ➜ Publier automatiquement dans le Fil
    const lines = [
      `🪶 Observation : ${species}`,
      `📅 ${date}${time ? ' ' + time : ''}`,
      notes ? `📝 ${notes}` : null
    ].filter(Boolean);
    addToFeed(lines.join('\n'));

    // Reset UI
    $('#obs-species').value = '';
    $('#obs-notes').value   = '';
    render();
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    // Protection : nécessite une session si fbAuth est dispo
    if (window.fbAuth?.requireLogin) window.fbAuth.requireLogin();

    load();
    render();

    const saveBtn = document.getElementById('obs-save');
    saveBtn && saveBtn.addEventListener('click', handleSave);
  });
})();
