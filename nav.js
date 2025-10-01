// FaceBird — Navigation commune (active auto)
(function () {
  const LINKS = [
    { href: 'index.html',       label: 'Accueil' },
    { href: 'feed.html',        label: 'Fil' },
    { href: 'observations.html',label: 'Observations' },
    { href: 'quiz.html',        label: 'Quiz' },
    { href: 'profil.html',      label: 'Profil' },
    { href: 'map.html',         label: 'Carte' },
    { href: 'groupes.html',     label: 'Groupes' },
    { href: 'messages.html',    label: 'Messages' },
  ];

  function currentName() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p.toLowerCase();
  }

  function makeLink(item, isActive) {
    return `<a ${isActive ? 'class="active"' : ''} href="${item.href}">${item.label}</a>`;
  }

  function renderNav() {
    const host = document.getElementById('site-nav');
    if (!host) return;

    const cur = currentName();
    host.innerHTML = `
      ${LINKS.map(l => makeLink(l, cur === l.href.toLowerCase())).join('\n')}
      <button id="theme-toggle" class="theme-toggle" type="button" aria-pressed="false">🌙 Mode sombre</button>
    `;
  }

  document.addEventListener('DOMContentLoaded', renderNav);
})();
