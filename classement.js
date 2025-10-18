// classement.js
(function(){
  // ───────── Helpers stockage ─────────
  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };

  // ⚠️ Adapte ici si tes clés diffèrent :
  const users = readJSON('fb_users', []) || readJSON('users', []);
  const posts = readJSON('fb_posts', []) || readJSON('posts', []);
  const obs   = readJSON('fb_observations', []) || readJSON('observations', []);
  const pointsMap = readJSON('fb_points', {}); // si tu gardes un compteur par id { [userId]: points }

  // ───────── Modèle unifié des utilisateurs ─────────
  // chaque user: { id, name, avatar?, points?, postsCount?, obsCount? }
  const byId = new Map();

  // 1) base: users connus
  users.forEach(u => {
    if (!u || (!u.id && !u.userId)) return;
    const id = u.id ?? u.userId;
    byId.set(id, {
      id,
      name: u.name ?? u.username ?? 'Anonyme',
      avatar: u.avatar ?? u.photo ?? '',
      points: Number(u.points ?? 0),
      postsCount: 0,
      obsCount: 0,
    });
  });

  // 2) complète à partir des posts/obs (et compile des points si pas fournis)
  const ensure = (id, name='Anonyme') => {
    if (!byId.has(id)) byId.set(id, { id, name, avatar:'', points:0, postsCount:0, obsCount:0 });
    return byId.get(id);
  };

  posts.forEach(p => {
    if (!p) return;
    const id = p.userId ?? p.authorId ?? p.ownerId;
    if (!id) return;
    const u = ensure(id, p.userName ?? p.author ?? 'Anonyme');
    u.postsCount++;
    // optionnel: points issus de posts (ex: +5/post +1/like)
    const base = 5;
    const likes = Array.isArray(p.likes) ? p.likes.length : Number(p.likes ?? 0);
    u.points += base + likes;
  });

  obs.forEach(o => {
    if (!o) return;
    const id = o.userId ?? o.authorId ?? o.ownerId;
    if (!id) return;
    const u = ensure(id, o.userName ?? o.author ?? 'Anonyme');
    u.obsCount++;
    // optionnel: points pour obs (ex: +10/obs)
    u.points += 10;
  });

  // 3) écrase/complète via carte de points si tu en gardes une séparée
  Object.entries(pointsMap || {}).forEach(([id, pts]) => {
    const u = ensure(id);
    u.points = Number(pts ?? u.points ?? 0);
  });

  // Fallback si aucune donnée
  if (byId.size === 0) {
    [
      { id:'u1', name:'Alice', points:120, postsCount:8, obsCount:5 },
      { id:'u2', name:'Bob',   points: 95, postsCount:5, obsCount:6 },
      { id:'u3', name:'Chloé', points: 80, postsCount:2, obsCount:7 },
    ].forEach(u=>byId.set(u.id, u));
  }

  let rows = Array.from(byId.values())
    .map(u => ({
      ...u,
      points: Number(u.points ?? 0),
      postsCount: Number(u.postsCount ?? 0),
      obsCount: Number(u.obsCount ?? 0),
    }))
    .sort((a,b) => b.points - a.points);

  // ───────── UI ─────────
  const $ = sel => document.querySelector(sel);
  const body = $('#board-body');
  const search = $('#search');
  const filter = $('#filter');

  function render(list) {
    body.innerHTML = '';
    list.forEach((u, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td class="usercell">
          ${u.avatar ? `<img src="${u.avatar}" class="avatar" alt="">` : `<span class="avatar placeholder">🐦</span>`}
          <span>${u.name}</span>
        </td>
        <td><strong>${u.points}</strong></td>
        <td>${u.postsCount}</td>
        <td>${u.obsCount}</td>
      `;
      body.appendChild(tr);
    });
  }

  function applyFilters() {
    const q = (search.value || '').toLowerCase().trim();
    let out = rows.filter(u => u.name.toLowerCase().includes(q));
    if (filter.value === 'top10') out = out.slice(0, 10);
    if (filter.value === 'top50') out = out.slice(0, 50);
    render(out);
  }

  search?.addEventListener('input', applyFilters);
  filter?.addEventListener('change', applyFilters);

  // styles minimes si besoin
  const style = document.createElement('style');
  style.textContent = `
    .table-scroll { overflow:auto; }
    .usercell { display:flex; align-items:center; gap:.6rem; }
    .avatar { width:28px; height:28px; border-radius:50%; object-fit:cover; }
    .avatar.placeholder { display:inline-grid; place-items:center; background:#eef; width:28px; height:28px; border-radius:50%; }
  `;
  document.head.appendChild(style);

  // rendu initial
  applyFilters();
})();
