// FaceBird - Observations avec persistance locale
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'fb-observations-v1';

  const form = document.getElementById('obs-form');
  const grid = document.getElementById('obs-grid');
  const dateInput = form?.querySelector('input[name="date"]');

  // -- Helpers de stockage --
  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const save = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  // -- Affichage d'une carte à partir d'un objet --
  function addCardFromObj(obs, prepend=false){
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>🐦 ${escapeHtml(obs.espece)}</h3>
      <p><span class="badge">${escapeHtml(obs.lieu)}</span> • ${escapeHtml(obs.date)}</p>
      <p>${escapeHtml(obs.desc)}</p>
    `;
    prepend ? grid.prepend(card) : grid.append(card);
  }

  // -- Sécurité HTML simple --
  function escapeHtml(str){
    return (str || '').toString().replace(/[&<>"']/g, s =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[s])
    );
  }

  // -- Date du jour par défaut --
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  }

  // -- Rendu initial depuis localStorage --
  const saved = load();            // [{espece, lieu, date, desc}, ...]
  saved.forEach(obs => addCardFromObj(obs, true)); // en haut de la grille

  // -- Soumission du formulaire --
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const espece = (data.get('espece')||'').toString().trim();
    if (!espece) return;

    const obs = {
      espece,
      lieu: (data.get('lieu')||'Lieu').toString().trim() || 'Lieu',
      date: (data.get('date')||'').toString() || "Aujourd’hui",
      desc: (data.get('desc')||'—').toString().trim() || '—',
      ts: Date.now()
    };

    // Ajoute dans l'UI et sauvegarde
    addCardFromObj(obs, true);
    const list = load();
    list.unshift(obs);
    save(list);

    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0,10);
  });
});
