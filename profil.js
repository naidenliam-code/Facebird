// profil.js — rendu complet + auth locale légère
(function () {
  const root = document.getElementById('profile');
  if (!root) return;

  // -------- Helpers stockage --------
  const LS = {
    get(key, def = null) {
      try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    },
    del(key) { try { localStorage.removeItem(key); } catch {} },
  };

  // Clés utilisées par le reste du site
  const KEY_USER   = 'fb_user';          // { id, name, avatar }
  const KEY_POINTS = 'fb_points';        // number
  const KEY_FEED   = 'fb_feed';          // [{id, text, ...}]
  const KEY_OBS    = 'fb_observations';  // [{id, ...}]
  const KEY_REACTS = 'fb_reactions';     // [{postId, userId, type}]

  function nowId() { return 'u_' + Date.now(); }

  function getUser() {
    return LS.get(KEY_USER, null);
  }

  function getPoints() {
    const n = Number(LS.get(KEY_POINTS, 0) || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function setPoints(n) {
    LS.set(KEY_POINTS, Math.max(0, Number(n) || 0));
  }

  // Stats à partir des données locales si présentes
  function getStats(user) {
    const feed  = LS.get(KEY_FEED, []);
    const obs   = LS.get(KEY_OBS, []);
    const reacts = LS.get(KEY_REACTS, []);

    const myPosts = Array.isArray(feed) ? feed.filter(p => p.userId === user?.id) : [];
    const myObs   = Array.isArray(obs)  ? obs.filter(o => o.userId === user?.id)  : [];
    const myReacsGiven = Array.isArray(reacts) ? reacts.filter(r => r.userId === user?.id) : [];
    const myReacsRecv  = Array.isArray(reacts) && Array.isArray(feed)
      ? reacts.filter(r => feed.some(p => p.id === r.postId && p.userId === user?.id))
      : [];

    return {
      posts: myPosts.length,
      observations: myObs.length,
      reactionsGiven: myReacsGiven.length,
      reactionsReceived: myReacsRecv.length,
      points: getPoints()
    };
  }

  function levelFromPoints(pts) {
    if (pts >= 500) return {label: 'Maître', color: '#6a1b9a', emoji:'🦚'};
    if (pts >= 250) return {label: 'Expert', color: '#c2185b', emoji:'🦜'};
    if (pts >= 100) return {label: 'Intermédiaire', color: '#1976d2', emoji:'🦉'};
    if (pts >= 25)  return {label: 'Débutant', color: '#2e7d32', emoji:'🐦'};
    return {label: 'Nouveau', color: '#546e7a', emoji:'🥚'};
  }

  // -------- Rendu quand pas connecté --------
  function renderLogin() {
    root.innerHTML = `
      <div class="stack" style="gap:.75rem">
        <p>Crée ton compte local pour suivre tes points et badges (données stockées sur cet appareil).</p>
        <label class="stack" style="gap:.25rem">
          <span>Ton pseudo</span>
          <input id="p-name" class="input" placeholder="Ex: Martin" maxlength="30">
        </label>

        <label class="stack" style="gap:.25rem">
          <span>Avatar (facultatif)</span>
          <select id="p-avatar" class="input">
            <option value="🐦">🐦 Oiseau</option>
            <option value="🦉">🦉 Chouette</option>
            <option value="🦜">🦜 Perroquet</option>
            <option value="🪶">🪶 Plume</option>
          </select>
        </label>

        <div class="row" style="gap:.5rem">
          <button id="p-create" class="btn">Créer mon compte</button>
          <a class="btn ghost" href="index.html">Annuler</a>
        </div>
      </div>
    `;

    const $name = root.querySelector('#p-name');
    const $avatar = root.querySelector('#p-avatar');
    const $btn = root.querySelector('#p-create');

    $btn.addEventListener('click', () => {
      const name = ($name.value || '').trim();
      if (name.length < 2) {
        $name.focus();
        $name.classList.add('shake');
        setTimeout(() => $name.classList.remove('shake'), 350);
        return;
      }
      const user = { id: nowId(), name, avatar: $avatar.value || '🐦' };
      LS.set(KEY_USER, user);
      // initialise les points s'il n'y en a pas
      if (!LS.get(KEY_POINTS)) setPoints(0);
      renderProfile(user);
    });
  }

  // -------- Rendu quand connecté --------
  function renderProfile(user) {
    const s = getStats(user);
    const lvl = levelFromPoints(s.points);

    root.innerHTML = `
      <div class="row" style="align-items:center; gap:1rem; flex-wrap:wrap">
        <div class="avatar" style="font-size:2.25rem">${user.avatar || '🐦'}</div>
        <div class="stack" style="gap:.25rem">
          <div class="row" style="gap:.5rem; align-items:center">
            <input id="p-edit-name" class="input" value="${escapeHtml(user.name)}" style="max-width:260px">
            <button id="p-save-name" class="btn">Sauver</button>
          </div>
          <div style="font-size:.95rem;opacity:.8">
            Niveau : <b style="color:${lvl.color}">${lvl.emoji} ${lvl.label}</b> – ${s.points} pts
          </div>
        </div>
      </div>

      <hr class="sep">

      <div class="grid" style="grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:.75rem">
        <div class="stat"><div class="label">Posts</div><div class="value">${s.posts}</div></div>
        <div class="stat"><div class="label">Observations</div><div class="value">${s.observations}</div></div>
        <div class="stat"><div class="label">Réactions reçues</div><div class="value">${s.reactionsReceived}</div></div>
        <div class="stat"><div class="label">Réactions données</div><div class="value">${s.reactionsGiven}</div></div>
        <div class="stat"><div class="label">Points</div><div class="value">${s.points}</div></div>
      </div>

      <hr class="sep">

      <div class="row" style="gap:.5rem; flex-wrap:wrap">
        <button id="p-add-pts" class="btn ghost">+5 pts (test)</button>
        <button id="p-logout" class="btn danger">Se déconnecter</button>
        <button id="p-wipe" class="btn danger ghost">Réinitialiser mes données</button>
      </div>
    `;

    root.querySelector('#p-save-name').addEventListener('click', () => {
      const name = root.querySelector('#p-edit-name').value.trim();
      if (name.length < 2) return;
      user.name = name;
      LS.set(KEY_USER, user);
      renderProfile(getUser());
    });

    root.querySelector('#p-add-pts').addEventListener('click', () => {
      setPoints(getPoints() + 5);
      renderProfile(getUser());
    });

    root.querySelector('#p-logout').addEventListener('click', () => {
      LS.del(KEY_USER);
      renderLogin();
    });

    root.querySelector('#p-wipe').addEventListener('click', () => {
      if (!confirm('Supprimer le profil et remettre les compteurs à zéro ?')) return;
      LS.del(KEY_USER);
      setPoints(0);
      // on ne supprime pas forcément feed/observations (à toi de voir)
      renderLogin();
    });
  }

  // -------- utils --------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"':'&quot;', "'": '&#39;'
    }[m]));
  }

  // -------- init --------
  const user = getUser();
  if (user) renderProfile(user); else renderLogin();
})();
