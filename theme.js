// FaceBird — theme.js
// Gestion du thème clair/sombre + persistance + accessibilité

(function () {
  const STORAGE_KEY = 'fb-theme';       // 'light' | 'dark' | 'system'
  const CLASS_DARK  = 'dark';
  const mql = window.matchMedia('(prefers-color-scheme: dark)');

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY) || 'system'; }
    catch { return 'system'; }
  }

  function store(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }

  function systemPrefersDark() {
    return mql.matches;
  }

  // Applique la classe sur <body>
  function applyTheme(mode) {
    const dark = (mode === 'dark') || (mode === 'system' && systemPrefersDark());
    document.body.classList.toggle(CLASS_DARK, dark);
    updateToggleButton(dark, mode);
  }

  // Met à jour le bouton (texte/état)
  function updateToggleButton(isDark, mode) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    // Texte/emoji selon l’état actuel
    btn.textContent = isDark ? '☀️ Mode clair' : '🌙 Mode sombre';
    // Astuce : appuie long = revenir au mode "système"
    btn.title = mode === 'system'
      ? 'Suivre le thème du système (clic pour basculer)'
      : 'Astuce : clic long pour repasser en mode système';
  }

  // Bascule light <-> dark en gardant "system" accessible via appui long
  function toggleTheme() {
    const cur = getStored();
    const next = cur === 'dark' ? 'light' : (cur === 'light' ? 'dark' : (systemPrefersDark() ? 'light' : 'dark'));
    store(next);
    applyTheme(next);
  }

  // Appui long (600ms) => remettre sur "system"
  function bindLongPressToSystem(btn) {
    if (!btn) return;
    let timer = null;
    btn.addEventListener('pointerdown', () => {
      timer = window.setTimeout(() => {
        store('system');
        applyTheme('system');
        // petit feedback visuel
        btn.classList.add('pulse');
        setTimeout(()=>btn.classList.remove('pulse'), 400);
        timer = null;
      }, 600);
    });
    ['pointerup','pointerleave','pointercancel'].forEach(type => {
      btn.addEventListener(type, () => { if (timer) { clearTimeout(timer); timer = null; } });
    });
  }

  // Synchronisation entre onglets
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) applyTheme(getStored());
  });

  // Si la préférence système change, réapplique si on est en mode "system"
  mql.addEventListener('change', () => {
    if (getStored() === 'system') applyTheme('system');
  });

  // Init au chargement
  document.addEventListener('DOMContentLoaded', () => {
    // Si aucune valeur stockée, initialise à 'system'
    if (!localStorage.getItem(STORAGE_KEY)) store('system');
    applyTheme(getStored());

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
      bindLongPressToSystem(btn);
    }
  });
})();
