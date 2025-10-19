// classement.js — Classement FaceBird
(function(){
  const $ = sel => document.querySelector(sel);
  const body = $('#board-body');
  const search = $('#search');
  const filter = $('#filter');

  // 🧩 Exemple de structure récupérée (tu peux remplacer selon ton app)
  const users = JSON.parse(localStorage.getItem('fb_users') || '[]');
  const posts = JSON.parse(localStorage.getItem('fb_posts') || '[]');
  const obs   = JSON.parse(localStorage.getItem('fb_observations') || '[]');

  const byId = new Map();

  const ensure = (id, name = 'Anonyme') => {
    if (!byId.has(id)) byId.set(id, { id, name, points: 0, posts: 0, obs: 0 });
    return byId.get(id);
  };

  // 🧮 Compile les points
  posts.forEach(p => {
    const id = p.userId ?? p.authorId ?? 'inconnu';
    const name = p.userName ?? p.author ?? 'Anonyme';
    const u = ensure(id, name);
    u.posts++;
    u.points += 5 + (p.likes?.length || 0);
  });

  obs.forEach(o => {
    const id = o.userId ?? o.authorId ?? 'inconnu';
    const name = o.userName ?? o.author ?? 'Anonyme';
    const u = ensure(id, name);
    u.obs++;
    u.points += 10;
  });

  // Données de démo si vide
  if (byId.size === 0) {
    [
      { id:'u1', name:'Alice', points:120, posts:8, obs:5 },
      { id:'u2', name:'Bob', points:95, posts:5, obs:6 },
      { id:'u3', name:'Chloé', points:80, posts:2, obs:7 }
    ].forEach(u => byId.set(u.id, u));
  }

  let rows = Array.from(byId.values()).sort((a,b)=>b.points - a.points);

  function render(list) {
    body.innerHTML = '';
    list.forEach((u,i)=>{
      const rank = i+1;
      let medal = '';
      if (rank === 1) medal = '🥇';
      else if (rank === 2) medal = '🥈';
      else if (rank === 3) medal = '🥉';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${medal || rank}</td>
        <td>${u.name}</td>
        <td><strong>${u.points}</strong></td>
        <td>${u.posts}</td>
        <td>${u.obs}</td>
      `;
      body.appendChild(tr);
    });
  }

  function applyFilters() {
    const q = (search.value || '').toLowerCase();
    let list = rows.filter(u => u.name.toLowerCase().includes(q));
    if (filter.value === 'top10') list = list.slice(0,10);
    if (filter.value === 'top50') list = list.slice(0,50);
    render(list);
  }

  search?.addEventListener('input', applyFilters);
  filter?.addEventListener('change', applyFilters);

  render(rows);

  // Un peu de style
  const style = document.createElement('style');
  style.textContent = `
    table { width:100%; border-collapse:collapse; margin-top:1rem; }
    th,td { padding:.6rem; text-align:left; border-bottom:1px solid #ddd; }
    tr:nth-child(odd) { background:#f9f9f9; }
    th { background:#1976d2; color:#fff; }
    input, select { padding:.4rem; border:1px solid #ccc; border-radius:.3rem; }
  `;
  document.head.appendChild(style);
})();
