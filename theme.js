// Applique le thème sauvé ou la préférence système au premier chargement
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem('fb-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (saved === 'dark' || (!saved && prefersDark)) {
    root.classList.add('dark');
  }

  function setButtonLabel(btn){
    const dark = root.classList.contains('dark');
    btn.textContent = dark ? '☀️ Mode clair' : '🌙 Mode sombre';
    btn.setAttribute('aria-pressed', String(dark));
  }

  // Quand la page est prête, branche le bouton
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    setButtonLabel(btn);
    btn.addEventListener('click', () => {
      root.classList.toggle('dark');
      localStorage.setItem('fb-theme', root.classList.contains('dark') ? 'dark' : 'light');
      setButtonLabel(btn);
    });
  });
})();
