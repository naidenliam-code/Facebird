// nav.js — Navigation globale FaceBird (anti-doublon)
(function () {
  // 0) Supprimer d'éventuelles anciennes barres (nav/menu) codées en dur
  const looksLikeOldNav = (el) =>
    /index\.html|feed\.html|observations\.html|quiz\.html|profil\.html|map\.html|classement\.html/i
      .test(el.innerHTML);

  // candidates: nav, header nav, .tabs, .menu, .navbar…
  const candidates = Array.from(document.querySelectorAll('nav, header nav, .tabs, .menu, .navbar'));
  candidates
    .filter((el) => looksLikeOldNav(el))
    .forEach((el) => {
      // si ce nav a un parent header dédié, enlève tout le header
      const h = el.closest('header');
      (h || el).remove();
    });

  // 1) Évite une double injection si déjà injecté
  if (document.querySelector('header.site-header')) return;

  const currentPage = location.pathname.split('/').pop();

  // 2) Marque HTML de la barre
  const navHTML = `
  <header class="site-header">
    <div class="brand">
      <span class="logo">🐦</span>
      <span class="title">FaceBird</span>
    </div>
    <nav class="tabs">
      <a href="index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>Accueil</a>
      <a href="feed.html" ${currentPage === 'feed.html' ? 'class="active"' : ''}>Fil</a>
      <a href="observations.html" ${currentPage === 'observations.html' ? 'class="active"' : ''}>Observations</a>
      <a href="quiz.html" ${currentPage === 'quiz.html' ? 'class="active"' : ''}>Quiz</a>
      <a href="profil.html" ${currentPage === 'profil.html' ? 'class="active"' : ''}>Profil</a>
      <a href="map.html" ${currentPage === 'map.html' ? 'class="active"' : ''}>Carte</a>
      <a href="classement.html" ${currentPage === 'classement.html' ? 'class="active"' : ''}>Classement</a>
      <button id="toggle-dark" class="btn">🌙 Mode sombre</button>
    </nav>
  </header>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // 3) Thème sombre/clair
  const toggle = document.getElementById('toggle-dark');
  if (toggle) {
    const html = document.documentElement;
    const pref = localStorage.getItem('theme') || 'light';
    html.dataset.theme = pref;
    toggle.textContent = pref === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre';

    toggle.addEventListener('click', () => {
      const now = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = now;
      localStorage.setItem('theme', now);
      toggle.textContent = now === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre';
    });
  }

  // 4) Styles
  const style = document.createElement('style');
  style.textContent = `
    header.site-header {
      background: var(--nav-bg, #f6f8fa);
      padding: .6rem 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      display:flex; align-items:center; justify-content:space-between;
      flex-wrap:wrap; gap:.75rem;
      position: sticky; top: 0; z-index: 1000;
    }
    .brand { font-weight:600; font-size:1.1rem; display:flex; align-items:center; gap:.35rem; }
    nav.tabs { display:flex; gap:.25rem; flex-wrap:wrap; align-items:center; }
    nav.tabs a {
      text-decoration:none; color:inherit;
      padding:.4rem .8rem; border-radius:.4rem;
    }
    nav.tabs a.active { background:#1976d2; color:#fff; }
    nav.tabs a:hover { background:#e0e0e0; }
    #toggle-dark.btn { margin-left:.25rem; padding:.4rem .6rem; border-radius:.4rem; border:0; cursor:pointer; }
    [data-theme="dark"] header.site-header { background:#222; color:#eee; }
    [data-theme="dark"] nav.tabs a:hover { background:#333; }
    [data-theme="dark"] nav.tabs a.active { background:#1565c0; }
  `;
  document.head.appendChild(style);
})();
