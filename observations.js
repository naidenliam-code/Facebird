// Ajout local d'une carte (démo sans base de données)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('obs-form');
  const grid = document.getElementById('obs-grid');

  // met la date du jour par défaut
  const dateInput = form.querySelector('input[name="date"]');
  if (dateInput && !dateInput.value) {
    const d = new Date();
    dateInput.value = d.toISOString().slice(0,10); // YYYY-MM-DD
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const espece = (data.get('espece')||'').toString().trim();
    const lieu   = (data.get('lieu')||'').toString().trim() || 'Lieu';
    const desc   = (data.get('desc')||'').toString().trim() || '—';
    const date   = (data.get('date')||'').toString() || "Aujourd’hui";
    if (!espece) return;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>🐦 ${escapeHtml(espece)}</h3>
      <p><span class="badge">${escapeHtml(lieu)}</span> • ${escapeHtml(date)}</p>
      <p>${escapeHtml(desc)}</p>
    `;
    grid.prepend(card);
    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0,10);
    card.scrollIntoView({behavior:'smooth', block:'center'});
  });

  function escapeHtml(str){
    return str.replace(/[&<>"']/g, s => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[s]
    ));
  }
});
