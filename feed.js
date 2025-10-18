// feed.js — Fil local : création + édition + suppression + réactions (1 seule par post)
// Stockage :
//  - facebird_posts : tableau des posts [{id,text,date,updatedAt?,reactions:{emoji->count}}]
//  - facebird_myreactions : { [postId]: "emojiChoisi" }  (une seule réaction par post)

const textarea   = document.getElementById('post-content');
const publishBtn = document.getElementById('publish');
const postsDiv   = document.getElementById('posts');

const FEED_KEY = 'facebird_posts';
const MY_REACTS_KEY = 'facebird_myreactions';

// Émojis disponibles
const REACTIONS = ['👍','❤️','🐦','😂','😮','🎉'];

// ---------- Utils ----------
const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowStr = () => new Date().toLocaleString();

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function nl2brSafe(s) { return escapeHTML(s).replace(/\n/g,'<br>'); }

// ---------- État ----------
let posts = load(FEED_KEY, []);
let myReacts = load(MY_REACTS_KEY, {}); // { postId: "emoji" }

// Migration posts : id + structure reactions
let migrated = false;
posts.forEach(p => {
  if (!p.id) { p.id = uid(); migrated = true; }
  if (!p.reactions) {
    p.reactions = {}; REACTIONS.forEach(e => p.reactions[e] = 0);
    migrated = true;
  } else {
    REACTIONS.forEach(e => { if (typeof p.reactions[e] !== 'number') p.reactions[e] = 0; });
  }
});
if (migrated) save(FEED_KEY, posts);

// Migration myReacts : si ancien format objet {emoji:true,...}, on garde le 1er actif
Object.keys(myReacts).forEach(pid => {
  const val = myReacts[pid];
  if (val && typeof val === 'object') {
    const first = Object.keys(val).find(k => val[k]);
    myReacts[pid] = first || null;
  }
});
save(MY_REACTS_KEY, myReacts);

// ---------- Rendu ----------
function renderReactions(post) {
  const mine = myReacts[post.id] || null;
  return `
    <div class="row" style="gap:6px; margin-top:6px; flex-wrap:wrap">
      ${REACTIONS.map(emo => {
        const count = post.reactions?.[emo] || 0;
        const active = (mine === emo) ? 'aria-pressed="true"' : '';
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
    delete myReacts[id]; // nettoie ma réaction locale pour ce post
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

  // Réaction (1 seule par post)
  if (action === 'react') {
    const emoji = btn.dataset.emoji;
    const post  = posts[idx];

    // Réaction actuelle (si existe)
    const current = myReacts[id] || null;

    if (current === emoji) {
      // Re-cliquer sur la même réaction => on l'enlève
      post.reactions[emoji] = Math.max(0, (post.reactions[emoji] || 0) - 1);
      myReacts[id] = null;
    } else {
      // On change de réaction : décrémente l'ancienne si elle existait
      if (current && typeof post.reactions[current] === 'number') {
        post.reactions[current] = Math.max(0, post.reactions[current] - 1);
      }
      // Puis incrémente la nouvelle
      post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
      myReacts[id] = emoji;
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

  if (action === 'cancel') { renderPosts(); return; }

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
