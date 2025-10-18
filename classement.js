/* FaceBird – Classement (leaderboard)
   Lit les utilisateurs/points depuis localStorage.
   Robuste : si fb_users n’existe pas, on agrège via fb_posts.
*/

const LS_USERS = 'fb_users';
const LS_POSTS = 'fb_posts';
const LS_ME    = 'fb_currentUser';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

// --------- Récupération des données (robuste) ----------
function getUsersFromStorage() {
  try {
    const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
    if (Array.isArray(users) && users.length) return users;
  } catch {}
  return [];
}

function aggregateFromPosts() {
  // fallback si fb_users absent : on reconstruit à partir des posts
  try {
    const posts = JSON.parse(localStorage.getItem(LS_POSTS) || '[]');
    const map = new Map();
    for (const p of posts) {
      const uid = p.user?.id || p.userId || 'anon';
      const name = p.user?.name || p.userName || p.author || 'Anonyme';
      const points = Number(p.points || 0);
      const obs = Number(p.observations || 0);

      const curr = map.get(uid) || { id: uid, name, avatar: p.user?.avatar || '', points: 0, level: 1, observations: 0 };
      curr.points += points;
      curr.observations += (obs || 1); // on compte au moins 1 observation par post
      map.set(uid, curr);
    }
    return [...map.values()];
  } catch {
    return [];
  }
}

function normalizeUsers(raw) {
  // Garantit la présence des champs utilisés par l’UI
  return raw.map(u => ({
    id: u.id || crypto.randomUUID(),
    name: u.name || u.pseudo || 'Anonyme',
    avatar: u.avatar || '',
    points: Number(u.points || 0),
    level: Number(u.level || u.niveau || 1),
    observations: Number(u.observations || u.obs || 0),
  }));
}

function getAllUsers() {
  let users = getUsersFromStorage();
  if (!users.length) users = aggregateFromPosts();
  return normalizeUsers(users);
}

function getMe() {
  try {
    return JSON.parse(localStorage.getItem(LS_ME) || 'null');
  } catch { return null; }
}

// --------- Rendu UI ----------
function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return ' ';
}

function renderTop3(users) {
  const top3 = users.slice(0, 3);
  const c = $('#top3');
  c.innerHTML = top3.map((u, i) => `
    <article class="card">
      <div class="row between center">
        <div class="row center gap">
          <div style="font-size:24px">${medal(i+1)}</div>
          <div>
            <div style="font-weight:700">${u.name}</div>
            <div class="muted">Niveau ${u.level} • ${u.observations} obs.</div>
          </div>
        </div>
        <div class="chip" title="Points">${u.points.toLocaleString('fr-FR')} pts</div>
      </div>
    </article>
  `).join('');
}

function renderTable(users) {
  const tbody = $('#rows');
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${i+1 <= 3 ? medal(i+1) : i+1}</td>
      <td>
        <div class="row gap center">
          ${u.avatar ? `<img src="${u.avatar}" alt="" width="24" height="24" style="border-radius:50%">` : '👤'}
          <span>${u.name}</span>
        </div>
      </td>
      <td class="right">${u.points.toLocaleString('fr-FR')}</td>
      <td class="right">${u.level}</td>
      <td class="right">${u.observations}</td>
    </tr>
  `).join('');
}

function applySortFilter(users) {
  const q = $('#search').value.trim().toLowerCase();
  const sort = $('#sort').value;

  let filtered = users.filter(u => u.name.toLowerCase().includes(q));

  switch (sort) {
    case 'points-asc':  filtered.sort((a,b)=> a.points - b.points); break;
    case 'name-asc':    filtered.sort((a,b)=> a.name.localeCompare(b.name)); break;
    case 'name-desc':   filtered.sort((a,b)=> b.name.localeCompare(a.name)); break;
    default:            filtered.sort((a,b)=> b.points - a.points); // points-desc
  }

  // Re-rank après tri
  filtered.forEach((u, i) => { u._rank = i+1; });
  return filtered;
}

function highlightMeBadge(users) {
  const me = getMe();
  const el = $('#meBadge');
  if (!me) { el.textContent = ''; return; }

  const idx = users.findIndex(u => (u.id === me.id) || (u.name === me.name));
  if (idx >= 0) {
    const rank = idx + 1;
    el.textContent = `Tu es ${rank}ᵉ sur ${users.length} 🎯`;
  } else {
    el.textContent = 'Tu n’es pas encore classé(e) sur cet appareil.';
  }
}

// --------- Init ----------
let ALL = [];

function refresh() {
  const sorted = applySortFilter(ALL);
  renderTop3(sorted);
  renderTable(sorted);
  highlightMeBadge(sorted);
}

function init() {
  ALL = getAllUsers();
  // normalise si vide : on injecte un petit exemple pour la démo locale
  if (!ALL.length) {
    ALL = normalizeUsers([
      { id:'u1', name:'Huppe Fasciée', points: 320, level: 4, observations: 18 },
      { id:'u2', name:'Pic Vert',      points: 250, level: 3, observations: 12 },
      { id:'u3', name:'Mésange Bleue', points: 540, level: 5, observations: 26 },
      { id:'u4', name:'Rougegorge',    points: 120, level: 2, observations: 7  },
    ]);
  }

  $('#search').addEventListener('input', refresh);
  $('#sort').addEventListener('change', refresh);
  window.addEventListener('storage', () => { ALL = getAllUsers(); refresh(); });

  refresh();
}

document.addEventListener('DOMContentLoaded', init);
