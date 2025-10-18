// feed.js — Fil local avec création + édition + suppression
// Stockage dans localStorage sous la clé "facebird_posts"

const textarea   = document.getElementById('post-content');
const publishBtn = document.getElementById('publish');
const postsDiv   = document.getElementById('posts');

const FEED_KEY = 'facebird_posts';

// ---------- Utils ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function loadPosts() {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(FEED_KEY) || '[]'); } catch { arr = []; }
  // Migration : si anciens posts sans id, on leur en met un
  let changed = false;
  arr.forEach(p => { if (!p.id) { p.id = uid(); changed = true; } });
  if (changed) savePosts(arr);
  return arr;
}

function savePosts(arr) {
  localStorage.setItem(FEED_KEY, JSON.stringify(arr));
}

function nowStr() {
  return new Date().toLocaleString();
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function nl2brSafe(s) {
  return escapeHTML(s).replace(/\n/g, '<br>');
}

// État en mémoire
let posts = loadPosts();

// ---------- Rendu ----------
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
    date: nowStr()
  };
  posts.unshift(newPost);
  savePosts(posts);

  if (textarea) textarea.value = '';
  renderPosts();
});

// ---------- Événements (édition / suppression) ----------
postsDiv?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const article = btn.closest('article.post');
  if (!article) return;

  const id = article.getAttribute('data-id');
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return;

  if (action === 'delete') {
    // Supprimer
    posts.splice(idx, 1);
    savePosts(posts);
    renderPosts();
    return;
  }

  if (action === 'edit') {
    // Passer en mode édition : remplacer le texte par un textarea + boutons
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
});

// Sauvegarde / Annuler en mode édition (délégation d'événements)
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
    // Ré-afficher le post sans modifier
    renderPosts();
    return;
  }

  if (action === 'save') {
    const area = article.querySelector('.edit-area');
    const newText = (area?.value || '').trim();
    posts[idx].text = newText;
    posts[idx].updatedAt = nowStr();
    savePosts(posts);
    renderPosts();
    return;
  }
});

// Premier rendu
renderPosts();
