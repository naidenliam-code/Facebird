// login.js — Auth locale FaceBird (sans serveur)
// Stockage : localStorage
//  - fb_users : { [username]: { passHash, avatarDataUrl, createdAt } }
//  - fb_session : { username }
// Sécurité : hash SHA-256 côté client (basique pour démo)

const STORAGE_USERS = 'fb_users';
const STORAGE_SESSION = 'fb_session';

// Utils ----------

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USERS)) || {}; }
  catch { return {}; }
}
function saveUsers(u) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(u));
}
function setSession(username) {
  localStorage.setItem(STORAGE_SESSION, JSON.stringify({ username, at: Date.now() }));
  renderAuthSlot();
}
function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
  renderAuthSlot();
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SESSION)); } catch { return null; }
}
function dataUrlFromFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// UI Helpers ----------
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function renderAuthSlot() {
  const slot = document.getElementById('auth-slot');
  if (!slot) return;
  const sess = getSession();
  if (sess?.username) {
    slot.innerHTML = `
      <span class="badge">Connecté : <strong>${sess.username}</strong></span>
      <button class="btn-small" id="logout-btn">Se déconnecter</button>
    `;
    slot.querySelector('#logout-btn').onclick = () => {
      clearSession();
      toast('Déconnecté.');
      // Option : si on est sur feed.html, on reste ; sur profil.html on peut rafraîchir
      if (location.pathname.endsWith('profil.html')) location.reload();
    };
  } else {
    slot.innerHTML = `<a class="btn-small" href="login.html">Se connecter</a>`;
  }
}

// Actions ----------

// Création de compte
async function handleSignup() {
  const username = document.getElementById('su-username').value.trim();
  const password = document.getElementById('su-password').value;
  const avatarFile = document.getElementById('su-avatar').files?.[0];

  // validations
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    toast('Pseudo invalide (3–20, lettres/chiffres/_).');
    return;
  }
  if (!password || password.length < 6) {
    toast('Mot de passe trop court (min 6).');
    return;
  }

  const users = loadUsers();
  if (users[username]) {
    toast('Ce pseudo est déjà pris.');
    return;
  }

  const passHash = await sha256(password);
  let avatarDataUrl = '';
  if (avatarFile) {
    try { avatarDataUrl = await dataUrlFromFile(avatarFile); } catch {}
  }

  users[username] = {
    passHash,
    avatarDataUrl,
    createdAt: new Date().toISOString()
  };
  saveUsers(users);
  setSession(username);
  toast('Compte créé et connecté !');

  // redirection si "next" dans l’URL
  const next = new URLSearchParams(location.search).get('next');
  location.href = next || 'profil.html';
}

// Connexion
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const users = loadUsers();
  const u = users[username];
  if (!u) { toast('Utilisateur introuvable.'); return; }

  const passHash = await sha256(password);
  if (passHash !== u.passHash) {
    toast('Mot de passe incorrect.');
    return;
  }

  setSession(username);
  toast('Connecté !');
  const next = new URLSearchParams(location.search).get('next');
  location.href = next || 'profil.html';
}

// Protection optionnelle d’une page : à appeler en haut d’une page protégée
function requireLogin() {
  const sess = getSession();
  if (!sess?.username) {
    const next = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    location.href = `login.html?next=${next}`;
  }
}

// Bind UI si présent
document.addEventListener('DOMContentLoaded', () => {
  renderAuthSlot();

  const suBtn = document.getElementById('btn-signup');
  if (suBtn) suBtn.addEventListener('click', handleSignup);

  const lgBtn = document.getElementById('btn-login');
  if (lgBtn) lgBtn.addEventListener('click', handleLogin);
});

// Expose quelques fonctions globales si besoin ailleurs
window.fbAuth = { getSession, clearSession, requireLogin };
