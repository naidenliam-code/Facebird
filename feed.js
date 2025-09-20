// FaceBird - Fil d'actualité (likes, commentaires, partage) + avatar niveau
(function () {
  const KEY = 'fb-observations-v1';
  const USERNAME = 'Liam';

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (str = '') =>
    String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));

  // emoji d'espèce dans le titre (on garde cette info)
  const speciesIcon = (espece = '') => {
    const s = espece.toLowerCase();
    if (s.includes('hibou') || s.includes('chouette')) return '🦉';
    if (s.includes('pigeon')) return '🕊️';
    if (s.includes('mesange') || s.includes('mésange')) return '🐦';
    return '🐦';
  };

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));

  function normalize(list) {
    let changed = false;
    list.forEach(o => {
      if (!o.id) { o.id = 'o' + (o.ts || Date.now()) + Math.floor(Math.random() * 1000); changed = true; }
      if (typeof o.likes !== 'number') { o.likes = 0; changed = true; }
      if (!Array.isArray(o.comments)) { o.comments = []; changed = true; }
    });
    if (changed) save(list);
    return list;
  }

  function renderFeed() {
    const feed = $('#feed');
    const list = normalize(load()).sort((a, b) => (b.ts || 0) - (a.ts || 0));

    if (!list.length) {
      feed.innerHTML = `<div class="card empty">Aucune observation pour l’instant. Ajoute-en une depuis <a href="observations.html">Observations</a> !</div>`;
      return;
    }

    feed.innerHTML = '';
    list.forEach(o => feed.appendChild(renderPost(o)));
  }

  function renderPost(o) {
    const card = document.createElement('div');
    card.className = 'card';

    // avatar de niveau (global utilisateur)
    const pts = FB_POINTS?.load() || 0;
    const avatar = FB_POINTS?.getAvatar(pts) || '🐦';

    const hasGPS = typeof o.lat === 'number' && typeof o.lng === 'number';

    card.innerHTML = `
      <div class="post">
        <div class="avatar" style="font-size:28px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--card-bg-weak,#eef3ff)">${avatar}</div>
        <div class="post-body">
          <div class="post-head">
            <strong>${speciesIcon(o.espece)} ${esc(o.espece || 'Observation')}</strong>
            ${o.lieu ? `<span class="badge">${esc(o.lieu)}</span>` : ''}
            ${hasGPS ? `<span class="badge">GPS ✔</span>` : ''}
            <small class="muted">• ${esc(o.date || '')}</small>
          </div>
          <p style="margin:.4rem 0 0">${esc(o.desc || '—')}</p>

          <div class="post-actions">
            <button class="icon-btn like-btn" aria-pressed="false" data-id="${o.id}">❤️ <span class="lk">${o.likes}</span></button>
            <button class="icon-btn cmt-toggle" data-id="${o.id}">💬 Commenter</button>
            <button class="icon-btn share-btn" data-id="${o.id}">📤 Partager</button>
            ${hasGPS ? `<a class="icon-btn" href="map.html" title="Voir sur la carte">🗺️ Carte</a>` : ''}
          </div>

          <div class="comments" data-id="${o.id}" hidden>
            <div class="cmt-list">
              ${o.comments.map(c => `<div class="comment"><b>${esc(c.author)}</b> <small>${esc(c.when)}</small><br>${esc(c.text)}</div>`).join('')}
            </div>
            <form class="comment-form" data-id="${o.id}">
              <input type="text" required maxlength="280" placeholder="Ajouter un commentaire…">
              <button class="btn" type="submit">Envoyer</button>
            </form>
          </div>
        </div>
      </div>
    `;

    const likeBtn = $('.like-btn', card);
    likeBtn.addEventListener('click', () => toggleLike(o.id, likeBtn));

    const toggle = $('.cmt-toggle', card);
    const cwrap = $('.comments', card);
    toggle.addEventListener('click', () => {
      cwrap.hidden = !cwrap.hidden;
      if (!cwrap.hidden) $('input', cwrap)?.focus();
    });

    const form = $('.comment-form', card);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('input', form);
      const txt = input.value.trim();
      if (!txt) return;
      addComment(o.id, { author: USERNAME, text: txt, when: new Date().toLocaleString() });
      const lst = $('.cmt-list', cwrap);
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `<b>${esc(USERNAME)}</b> <small>${esc(new Date().toLocaleString())}</small><br>${esc(txt)}`;
      lst.appendChild(div);
      input.value = '';
      FB_POINTS?.add('comment');
    });

    const shareBtn = $('.share-btn', card);
    shareBtn.addEventListener('click', () => sharePost(o));

    return card;
  }

  function toggleLike(id, btn) {
    const list = load();
    const i = list.findIndex(x => x.id === id); if (i < 0) return;
    const LKEY = 'fb-liked-' + id;
    const liked = localStorage.getItem(LKEY) === '1';
    if (liked) {
      list[i].likes = Math.max(0, (list[i].likes || 0) - 1);
      localStorage.removeItem(LKEY);
      btn.setAttribute('aria-pressed', 'false');
    } else {
      list[i].likes = (list[i].likes || 0) + 1;
      localStorage.setItem(LKEY, '1');
      btn.setAttribute('aria-pressed', 'true');
      FB_POINTS?.add('like', { onceId: id });
    }
    save(list);
    $('.lk', btn).textContent = list[i].likes;
  }

  function addComment(id, cmt) {
    const list = load();
    const i = list.findIndex(x => x.id === id); if (i < 0) return;
    list[i].comments = list[i].comments || [];
    list[i].comments.push(cmt);
    save(list);
  }

  function sharePost(o) {
    const text = `🐦 ${o.espece || 'Observation'}${o.lieu ? ' • ' + o.lieu : ''} — ${o.desc || ''}`;
    const url = location.origin + location.pathname.replace(/feed\.html$/, 'index.html');
    const done = () => FB_POINTS?.add('share');

    if (navigator.share) {
      navigator.share({ title: 'FaceBird', text, url }).then(done).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`).then(()=>{
        toast('Lien copié 📋'); done();
      });
    }
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }

  document.addEventListener('DOMContentLoaded', renderFeed);
})();
