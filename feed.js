// feed.js — Fil local : création + édition + suppression + réactions
// Stockage principal : localStorage["facebird_posts"]
// Réactions perso (par appareil/utilisateur) : localStorage["facebird_myreactions"]

const textarea   = document.getElementById('post-content');
const publishBtn = document.getElementById('publish');
const postsDiv   = document.getElementById('posts');

const FEED_KEY = 'facebird_posts';
const MY_REACTS_KEY = 'facebird_myreactions';

// Choisis les émojis que tu veux afficher
const REACTIONS = ['👍','❤️','🐦','😂','😮','🎉'];

// ---------- Utils ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowStr = () => new Date().toLocaleString();

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function nl2brSafe(s) { return escapeHTML(s).replace(/\n/g,'<br>'); }

// Posts + réactions stockés
let posts = load(FEED_KEY, []);
let myReacts = load(MY_REACTS_KEY, {}); // { [postId]: { [emoji]: true } }

// Migration : ajoute id et structure reactions aux anciens posts
let migrated = false;
posts.forEach(p => {
  if (!p.id) { p.id = uid(); migrated = true; }
  if (!p.reactions) {
    p.reactions = {}; REACTIONS.forEach(e => p.reactions[e] = 0);
    migrated = true;
  } else {
    // S'assure que toutes les clés existent
    REACTIONS.forEach(e => { if (typeof p.reactions[e] !== 'number') p.reactions[e] = 0; });
  }
});
if (migrated) save(FEED_KEY, posts);

// ---------- Rendu ----------
function renderReactions(post) {
  const mine = myReacts[post.id] || {};
  return `
    <div class="row" style="gap:6px; margin-top:6px; flex-wrap:wrap">
      ${REACTIONS.map(emo => {
        const count = post.reactions?.[emo] || 0;
        const active = mine[emo] ? 'aria-pressed="true"' : '';
        return `
          <button class="icon-btn" data-action="react" data-emoji="${emo}" ${active}>
            <span>${emo}</span>
            <small>${count}</small>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderPosts() {
  if (!postsDiv) return;

  if (!posts.length) {
    postsDiv.innerHTML = "<p>Aucun post pour le moment. Écris un message ci-dessus ou ajoute une observation !</p>";
    return;
  }

  postsDiv.innerHTML = posts.map(p => {
    const textHtml = nl2brSafe(p.text || '');
    const date = p.updatedAt ? `Modifié : ${p.updatedAt}` : `Publié : ${p.date || ''}`;
    return `
      <article class="post" data-id="${p.id}">
        <div class="post-body">
          <div class="post-text">${textHtml}</div>
          <small class="muted">${date}</small>

          <div class="post-actions">
            <button class="btn-small" data-action="edit">✏️ Modifier</button>
            <button class="btn-small" data-action="delete">🗑️ Supprimer</button>
          </div>

          ${renderReactions(p)}
        </div>
      </article>
    `;
  }).join('');
}

// ---------- Création ----------
publishBtn?.addEventListener('click', () => {
  const text = (textarea?.value || '').trim();
  if (!text) return;

  const newPost = {
    id: uid(),
    text,
    date: nowStr(),
    reactions: REACTIONS.reduce((acc, e) => (acc[e]=0, acc), {})
  };
  posts.unshift(newPost);
  save(FEED_KEY, posts);

  if (textarea) textarea.value = '';
  renderPosts();
});

// ---------- Délégation d'événements (edit / delete / react) ----------
postsDiv?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const article = btn.closest('article.post');
  if (!article) return;

  const id = article.getAttribute('data-id');
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return;

  // Supprimer
  if (action === 'delete') {
    posts.splice(idx, 1);
    // Nettoie aussi mes réactions locales pour ce post
    delete myReacts[id];
    save(FEED_KEY, posts);
    save(MY_REACTS_KEY, myReacts);
    renderPosts();
    return;
  }

  // Passer en mode édition
  if (action === 'edit') {
    const current = posts[idx];
    const body = article.querySelector('.post-body');
    body.innerHTML = `
      <div class="post-edit">
        <textarea class="edit-area" rows="4">${escapeHTML(current.text)}</textarea>
        <div class="row" style="margin-top:8px">
          <button class="btn" data-action="save">💾 Enregistrer</button>
          <button class="btn-small" data-action="cancel">Annuler</button>
        </div>
        <small class="muted">Dernier état : ${current.updatedAt || current.date || ''}</small>
      </div>
    `;
    return;
  }

  // Réaction (toggle)
  if (action === 'react') {
    const emoji = btn.dataset.emoji;
    const post = posts[idx];

    // init structures
    if (!myReacts[id]) myReacts[id] = {};
    if (typeof post.reactions?.[emoji] !== 'number') {
      if (!post.reactions) post.reactions = {};
      post.reactions[emoji] = 0;
    }

    // toggle : si j'avais déjà réagi avec cet emoji, on retire ; sinon on ajoute
    if (myReacts[id][emoji]) {
      myReacts[id][emoji] = false;
      post.reactions[emoji] = Math.max(0, post.reactions[emoji] - 1);
    } else {
      myReacts[id][emoji] = true;
      post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
    }

    save(FEED_KEY, posts);
    save(MY_REACTS_KEY, myReacts);
    renderPosts();
    return;
  }
});

// Sauvegarde / Annuler en mode édition
postsDiv?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  if (action !== 'save' && action !== 'cancel') return;

  const article = btn.closest('article.post');
  if (!article) return;

  const id = article.getAttribute('data-id');
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return;

  if (action === 'cancel') {
    renderPosts();
    return;
  }

  if (action === 'save') {
    const area = article.querySelector('.edit-area');
    const newText = (area?.value || '').trim();
    posts[idx].text = newText;
    posts[idx].updatedAt = nowStr();
    save(FEED_KEY, posts);
    renderPosts();
    return;
  }
});

// Premier rendu
renderPosts();
