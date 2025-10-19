// nav.js — Navigation globale FaceBird
(function() {
  // Empêche le doublon si déjà injecté
  if (document.querySelector('header.site-header')) return;

  const currentPage = location.pathname.split('/').pop();

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

  // 🌗 Mode sombre / clair
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

  // 💅 Style intégré
  const style = document.createElement('style');
  style.textContent = `
    header.site-header {
      background: var(--nav-bg, #f6f8fa);
      padding: .6rem 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      display:flex; align-items:center; justify-content:space-between;
      flex-wrap:wrap;
    }
    .brand { font-weight:600; font-size:1.1rem; display:flex; align-items:center; gap:.3rem; }
    nav.tabs a {
      text-decoration:none; color:inherit;
      padding:.4rem .8rem; border-radius:.4rem;
    }
    nav.tabs a.active {
      background:#1976d2; color:white;
    }
    nav.tabs a:hover {
      background:#e0e0e0;
    }
    [data-theme="dark"] header.site-header { background:#222; color:#eee; }
    [data-theme="dark"] nav.tabs a:hover { background:#333; }
    [data-theme="dark"] nav.tabs a.active { background:#1565c0; }
  `;
  document.head.appendChild(style);
})();
